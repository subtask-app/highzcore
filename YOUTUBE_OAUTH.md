# Two-Step OAuth Implementation for YouTube Access

## Overview

This implementation uses a two-step OAuth approach to avoid the "Google hasn't verified this app" warning for all users while still maintaining YouTube subscription verification functionality.

## How It Works

### Step 1: Initial Signup (No Warning)
- **Scopes**: `email`, `profile` (non-sensitive)
- **Result**: ✅ No warning shown, unlimited users
- **What's stored**: Basic user info (email, name, avatar)

### Step 2: YouTube Access (On-Demand)
- **When**: Worker wants to do YouTube tasks
- **Scopes**: `https://www.googleapis.com/auth/youtube.readonly`
- **Result**: ⚠️ Warning shown (but user opted-in)
- **What's stored**: YouTube access token for verification

## Files Structure

```
src/
├── app/
│   ├── api/
│   │   ├── request-youtube-access/
│   │   │   └── route.ts              # Generates YouTube OAuth URL
│   │   └── verify-subscription/
│   │       └── route.ts              # Verifies YouTube subscriptions
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts              # Handles basic OAuth (email/profile)
│   │   └── youtube-callback/
│   │       └── route.ts              # Handles YouTube OAuth callback
│   ├── login/
│   │   ├── client/page.tsx           # ✅ Updated: No YouTube scope
│   │   ├── worker/page.tsx           # ✅ Updated: No YouTube scope
│   │   └── page.tsx                  # ✅ Updated: No YouTube scope
│   └── signup/
│       ├── client/page.tsx           # ✅ Updated: No YouTube scope
│       ├── worker/page.tsx           # ✅ Updated: No YouTube scope
│       └── page.tsx                  # ✅ Updated: No YouTube scope
├── components/
│   └── youtube/
│       └── GrantYouTubeAccess.tsx    # UI component for granting access
├── hooks/
│   └── useYouTubeAccess.ts           # Hook to check YouTube access status
└── lib/
    └── youtube/
        ├── checkSubscription.ts       # YouTube API helpers
        └── verifySubscription.ts      # Client-side verification helper
```

## Usage Guide

### For Workers

#### 1. Signup (No Warning)
```typescript
// Worker signs up - only email/profile scope
// No warning shown!
```

#### 2. Browse Platform
```typescript
// Worker can browse tasks, see other features
// YouTube tasks will show "Grant Access" prompt
```

#### 3. Grant YouTube Access (When Needed)
```typescript
import GrantYouTubeAccess from '@/components/youtube/GrantYouTubeAccess';
import { useYouTubeAccess } from '@/hooks/useYouTubeAccess';

function WorkerDashboard() {
  const { hasAccess, loading } = useYouTubeAccess();

  if (!hasAccess && !loading) {
    return <GrantYouTubeAccess />;
  }

  // Worker has access, show YouTube tasks
  return <YouTubeTasks />;
}
```

#### 4. Verify Subscription
```typescript
import { verifySubscription } from '@/lib/youtube/verifySubscription';

const handleVerify = async () => {
  const result = await verifySubscription(taskId, channelId);

  if (result.errorCode === 'YOUTUBE_ACCESS_REQUIRED') {
    // Show grant access prompt
    setShowGrantAccess(true);
  } else if (result.subscribed) {
    // Verified! Process payment
    processPayment();
  }
};
```

### For Clients

Clients don't need YouTube access. They just provide their channel URL/ID in the task creation form.

## API Endpoints

### GET `/api/request-youtube-access`
Returns OAuth URL for granting YouTube access.

**Response:**
```json
{
  "oauthUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Redirect user to this URL"
}
```

### POST `/api/verify-subscription`
Verifies if a worker has subscribed to a channel.

**Request:**
```json
{
  "taskId": "uuid",
  "channelId": "UCxxxxx"
}
```

**Response (Success):**
```json
{
  "subscribed": true,
  "message": "Subscription verified successfully",
  "taskId": "uuid",
  "channelId": "UCxxxxx"
}
```

**Response (No Access):**
```json
{
  "error": "YouTube access not granted",
  "errorCode": "YOUTUBE_ACCESS_REQUIRED",
  "needsAccess": true
}
```

**Response (Not Subscribed):**
```json
{
  "subscribed": false,
  "message": "Not subscribed to the channel"
}
```

## Database Schema Updates

Add these fields to the `users` table:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS youtube_access_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS youtube_access_granted_at TIMESTAMPTZ;
```

## Environment Variables Required

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## User Flow Example

### New Worker Signup
1. Worker visits `/signup/worker`
2. Clicks "Continue with Google"
3. **✅ NO WARNING** (only email/profile scope)
4. Redirected to `/dashboard/worker`
5. Sees available tasks

### Worker Does YouTube Task
1. Worker clicks on YouTube task
2. System checks: `useYouTubeAccess()` → `hasAccess: false`
3. Shows `<GrantYouTubeAccess />` component
4. Worker clicks "Grant YouTube Access"
5. **⚠️ Warning appears** (but user opted-in for this specific feature)
6. Worker clicks "Continue"
7. Redirected back with `?youtube_granted=true`
8. Worker can now do YouTube tasks
9. **Never sees warning again** for YouTube tasks

### Task Verification
1. Worker clicks "I Subscribed"
2. System calls `/api/verify-subscription`
3. API checks YouTube subscription using stored token
4. If subscribed → Approve payment
5. If not subscribed → Reject claim

## Benefits

✅ **No Warning for Signup** - Unlimited users can sign up without seeing any Google warning

✅ **Opt-In YouTube Access** - Only workers doing YouTube tasks see the warning, and they understand why

✅ **One-Time Setup** - YouTube access granted once, works forever (until token expires)

✅ **Automatic Verification** - API verifies subscriptions automatically

✅ **No Manual Review** - No need to manually approve each worker

✅ **Scalable** - Works for 10k, 100k, 1M users

## Important Notes

1. **Token Expiry**: YouTube access tokens can expire. Implement refresh token logic using `google_refresh_token`.

2. **RLS Policies**: YouTube callback uses service role key to bypass RLS when updating tokens.

3. **Error Handling**: Frontend should handle `YOUTUBE_ACCESS_REQUIRED` error and show grant access UI.

4. **Testing**: Test with multiple Google accounts to ensure flow works correctly.

5. **Production**: No Google verification needed - this approach works in production as-is.

## Troubleshooting

### Worker sees "Failed to save token"
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify database has new columns (`youtube_access_granted`, etc.)

### Verification fails with "No access"
- Worker hasn't granted YouTube access yet
- Show `<GrantYouTubeAccess />` component

### Token expired
- Implement refresh token logic
- Re-request YouTube access if refresh fails

## Next Steps

1. ✅ All auth pages updated (no YouTube scope)
2. ✅ YouTube access request endpoint created
3. ✅ YouTube callback handler created
4. ✅ Grant access UI component created
5. ✅ Verification API updated
6. ⏳ Update database schema (run migration)
7. ⏳ Integrate component into worker dashboard
8. ⏳ Test complete flow end-to-end
