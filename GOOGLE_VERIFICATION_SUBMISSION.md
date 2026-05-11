# Google OAuth Verification Submission Guide for Highzcore

This guide walks you through submitting Highzcore for Google OAuth verification to allow public access.

---

## ⚠️ Before You Submit

Make sure you have completed:
- ✅ App deployed to production domain
- ✅ Privacy Policy page created
- ✅ Terms of Service page created
- ✅ Domain verified in Google Search Console
- ✅ All features working (authentication, dashboards, YouTube verification)

---

## 📝 Verification Application Details

### App Information

**App Name:** Highzcore

**App Description:**
```
Highzcore is a two-sided marketplace that connects Nigerian YouTube content creators
with workers who help them reach the 1,000 subscriber threshold needed for YouTube
monetization. Creators pay for real subscribers from real people, while workers earn
money by subscribing to channels with their Google accounts.
```

**App Category:** Productivity & Business

**Application Homepage:** `https://yourdomain.com`

**Privacy Policy URL:** `https://yourdomain.com/privacy`

**Terms of Service URL:** `https://yourdomain.com/terms`

---

## 🔐 Scopes Justification

### 1. `userinfo.email`
**Why we need it:**
```
We use the user's email address to:
- Create and identify user accounts in our system
- Send transactional emails (payment confirmations, withdrawal notifications)
- Enable communication between clients, workers, and admins
- Comply with Nigerian financial regulations for payments
```

**How we use it:**
- Stored securely in Supabase database
- Used for account identification and email notifications
- Never shared with third parties
- Users can view their email in their profile

### 2. `userinfo.profile`
**Why we need it:**
```
We use the user's profile information (name, photo) to:
- Display user identity in dashboards
- Personalize the user experience
- Show profile pictures in messaging system
- Build trust between creators and workers
```

**How we use it:**
- Display name and avatar in navigation header
- Show profile information in messaging
- Enhance user experience with personalization
- Never shared without user consent

### 3. `openid`
**Why we need it:**
```
We use OpenID Connect to:
- Securely authenticate users via Google OAuth
- Maintain secure user sessions
- Verify user identity for financial transactions
- Comply with authentication best practices
```

**How we use it:**
- Standard OAuth 2.0 authentication flow
- Secure session management via Supabase Auth
- No direct access to Google account credentials
- Industry-standard security implementation

### 4. `https://www.googleapis.com/auth/youtube.readonly`
**Why we need it:** ⭐ **MOST IMPORTANT**
```
We use YouTube read-only access to:
- Verify that workers have actually subscribed to creator channels
- Prevent fraud and ensure creators get real subscribers
- Check subscription status via YouTube Data API v3
- Maintain platform integrity and trust

This is ESSENTIAL for our business model. Without this scope, we cannot verify
subscriptions, which would allow fraud and defeat the entire purpose of our platform.
```

**How we use it:**
- Workers subscribe to a channel
- They mark the task as complete
- Our system calls YouTube API to verify the subscription exists
- If verified, worker gets paid ₦120
- If not verified, task remains incomplete
- No other YouTube data is accessed or stored

**Data Access Pattern:**
```javascript
// Example API call
GET https://www.googleapis.com/youtube/v3/subscriptions
?part=snippet
&mine=true
&forChannelId={CHANNEL_ID}
```

**What we CHECK:**
- Is the user subscribed to the specific channel? (Yes/No)

**What we DON'T access:**
- Watch history
- Liked videos
- Private playlists
- Comments or activity
- Video uploads
- Analytics data

---

## 🎥 Video Demonstration Script

**Duration:** 3-5 minutes

### Section 1: App Overview (30 seconds)
1. Show Highzcore homepage
2. Explain: "This is a marketplace where creators buy real subscribers and workers earn money"
3. Show pricing: "Creators pay ₦150/subscriber, workers earn ₦120/task"

### Section 2: User Authentication (1 minute)
1. Click "Sign Up"
2. Select "Worker" role
3. Click "Sign up with Google"
4. Show Google OAuth consent screen
5. **Point out the scopes being requested:**
   - Email address
   - Profile information
   - YouTube account (read-only)
6. Click "Allow"
7. Show successful redirect to worker dashboard

### Section 3: Worker Flow - YouTube Verification (2 minutes)
1. Worker dashboard: Show available tasks
2. Click "Claim Task" on a subscription task
3. Show task details: "Subscribe to [Channel Name]"
4. Click "Subscribe" button → Opens YouTube channel in new tab
5. **Show YouTube page:** Click Subscribe button
6. Return to Highzcore
7. Click "Mark as Complete"
8. **Show the loading state:** "Verifying subscription via YouTube API..."
9. **Show verification result:** "✓ Subscription verified! ₦120 added to wallet"
10. Show updated wallet balance

### Section 4: Data Usage Transparency (1 minute)
1. Go to Profile/Settings
2. Show connected Google account
3. Click "YouTube Permissions"
4. Explain: "We only check if you're subscribed to specific channels"
5. Show: "No other YouTube data is accessed"
6. Show: "You can revoke access anytime"

### Section 5: Privacy & Security (30 seconds)
1. Open Privacy Policy page
2. Scroll to "YouTube Data Usage" section
3. Show clear explanation of what data we access
4. Show "Disconnect Google Account" button

**End Screen:**
- Show homepage with tagline
- Display: "Built for Nigerian content creators and earners"

---

## 📄 Required Pages

### Privacy Policy (yourdomain.com/privacy)

Create a comprehensive privacy policy that includes:

```markdown
# Privacy Policy for Highzcore

Last updated: [Date]

## Data We Collect

### Google OAuth Data
- **Email Address**: Used for account creation and notifications
- **Profile Information**: Name and photo for user identification
- **YouTube Subscription Status**: Read-only access to verify task completion

### How We Use YouTube Data

**What We Access:**
- We check if a worker is subscribed to specific YouTube channels
- This verification is ONLY performed when a worker claims they completed a subscription task

**What We DON'T Access:**
- Watch history
- Liked videos or playlists
- Comments or activity
- Private information
- Video uploads or analytics

**Data Retention:**
- We do NOT store your YouTube data
- We only store the verification result (subscribed: yes/no)
- You can revoke YouTube access anytime in your Google Account settings

### Third-Party Services

**Google APIs:**
We use Google OAuth and YouTube Data API v3 to authenticate users and verify
subscriptions. Google's privacy policy applies: https://policies.google.com/privacy

**Supabase:**
User data is stored securely in Supabase (PostgreSQL database with encryption).
Supabase privacy policy: https://supabase.com/privacy

### Your Rights

- View your data: Access your profile anytime
- Delete your data: Contact us to request account deletion
- Revoke access: Disconnect Google account in settings
- Opt-out: Unsubscribe from emails at any time

### Contact Us

For privacy questions: privacy@yourdomain.com
For support: support@yourdomain.com

---

**Note:** We comply with Nigerian Data Protection Regulation (NDPR) and GDPR principles.
```

### Terms of Service (yourdomain.com/terms)

Create terms of service that include:

```markdown
# Terms of Service for Highzcore

Last updated: [Date]

## 1. Service Description

Highzcore connects YouTube creators with workers who subscribe to channels in
exchange for payment. Creators pay ₦150 per subscriber, workers earn ₦120 per task.

## 2. User Responsibilities

### For Workers:
- You must use your real Google/YouTube account
- You must actually subscribe to channels (verified via YouTube API)
- You must not create fake accounts or bot subscriptions
- You must keep subscriptions active (unsubscribing may result in penalties)

### For Creators:
- You must provide a valid YouTube channel URL
- You must pay for orders via bank transfer
- You acknowledge that organic growth takes time
- You must not abuse the messaging system

## 3. YouTube Terms Compliance

By using Highzcore, you agree to comply with:
- YouTube Terms of Service: https://www.youtube.com/t/terms
- YouTube Community Guidelines: https://www.youtube.com/howyoutubeworks/policies/community-guidelines/

**Important:** Highzcore facilitates real subscriptions from real people. We do not
engage in artificial inflation or bot activity, which violates YouTube's policies.

## 4. Payment Terms

- Creators pay ₦150 per subscriber
- Workers earn ₦120 per verified subscription
- Platform takes 20% fee (₦30 per subscription)
- Minimum withdrawal: ₦1,000
- Withdrawals processed within 24-48 hours

## 5. Verification Process

- All subscriptions verified via YouTube Data API v3
- Workers must complete subscription before marking task complete
- Unverified tasks will not be paid
- Attempting to fake subscriptions may result in account ban

## 6. Data Usage

- We use YouTube Data API to verify subscriptions only
- We access minimal YouTube data (subscription status only)
- Users can revoke access anytime
- See our Privacy Policy for details

## 7. Account Termination

We may terminate accounts for:
- Fraudulent activity (fake subscriptions)
- Violating YouTube Terms of Service
- Abuse of the platform or other users
- Non-payment (for creators)

## 8. Disclaimer

- Highzcore is not affiliated with YouTube or Google
- YouTube monetization eligibility is not guaranteed
- Results depend on YouTube's algorithms and policies
- We are not responsible for YouTube policy changes

## Contact

For support: support@yourdomain.com
For business inquiries: business@yourdomain.com
```

---

## 🎬 Video Recording Tips

### Tools to Use:
- **Loom** (https://loom.com) - Easy screen recording
- **OBS Studio** (Free) - Professional recording
- **QuickTime** (Mac) - Built-in screen recording

### Recording Checklist:
- [ ] Record in 1080p HD
- [ ] Use clear audio (narrate what you're doing)
- [ ] Show mouse clicks and interactions clearly
- [ ] Keep video under 5 minutes
- [ ] Upload to YouTube (unlisted) or Google Drive
- [ ] Test video link before submission

### What to Emphasize:
1. **Real people, real subscriptions** - Not bots or fake accounts
2. **YouTube API verification** - Show the actual API call/verification
3. **Minimal data access** - Only subscription status, nothing else
4. **User control** - Show revoke access option
5. **Transparency** - Clear privacy policy and terms

---

## 📤 Submission Process

### Step 1: Prepare Domain

1. **Deploy to production:**
   ```bash
   # Deploy to Vercel
   vercel --prod
   ```

2. **Verify domain in Google Search Console:**
   - Go to: https://search.google.com/search-console
   - Add property: `yourdomain.com`
   - Verify ownership (DNS or HTML file)

### Step 2: Update OAuth Configuration

1. **Update OAuth Consent Screen:**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Click "Edit App"
   - Update URLs:
     * Homepage: `https://yourdomain.com`
     * Privacy: `https://yourdomain.com/privacy`
     * Terms: `https://yourdomain.com/terms`
   - Add authorized domain: `yourdomain.com`
   - Save changes

2. **Update OAuth Client:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Edit your OAuth client
   - Add production redirect URIs:
     * `https://yourdomain.com/auth/callback`
     * `https://[supabase-id].supabase.co/auth/v1/callback`

### Step 3: Submit for Verification

1. **Go to OAuth Consent Screen:**
   - https://console.cloud.google.com/apis/credentials/consent

2. **Click "Publish App":**
   - You'll see warning about verification required
   - Click "Prepare for Verification"

3. **Fill Verification Form:**

   **Brand Information:**
   ```
   Developer/Company Name: Highzcore (or Your Company Name)
   Developer Email: your-email@domain.com
   Official Business Website: https://yourdomain.com
   ```

   **App Information:**
   ```
   Application Name: Highzcore
   Application Homepage: https://yourdomain.com
   Privacy Policy: https://yourdomain.com/privacy
   Terms of Service: https://yourdomain.com/terms
   ```

   **Authorized Domains:**
   ```
   yourdomain.com
   [supabase-project-id].supabase.co
   ```

   **Scope Justifications:** (Copy from sections above)

   **Video Demonstration:**
   - Upload your demo video
   - Provide link (YouTube unlisted or Google Drive)

4. **Additional Information:**
   ```
   Business Model: Two-sided marketplace connecting creators with workers

   Revenue Model: Platform fee (20%) on each transaction

   Primary Purpose: Help Nigerian YouTube creators reach monetization threshold
   (1,000 subscribers) while providing earning opportunities for workers

   Why YouTube Read-Only Scope:
   Essential for verifying that workers actually subscribed to creator channels.
   Without this verification, platform would be vulnerable to fraud. We ONLY check
   subscription status - no other YouTube data is accessed.
   ```

5. **Submit Application:**
   - Review all information
   - Click "Submit for Verification"
   - Save confirmation email

---

## ⏰ What to Expect

### Timeline:
- **Initial Review:** 3-5 business days
- **Additional Questions:** 1-2 weeks (if requested)
- **Final Approval:** 2-6 weeks total

### Possible Outcomes:

#### ✅ Approved
- All Google users can now sign in
- No more "unverified app" warning
- Ready for public launch!

#### ⚠️ Additional Information Requested
Google may ask for:
- More detailed video demonstration
- Clarification on YouTube data usage
- Updated privacy policy
- Business registration documents

**Response Time:** Respond within 7 days to avoid rejection

#### ❌ Rejected
Common reasons:
- Video doesn't clearly show YouTube data usage
- Privacy policy unclear or incomplete
- App doesn't need all requested scopes
- Suspicious activity or fraud concerns

**Solution:** Fix issues and resubmit (usually approved second time)

---

## 🔍 Approval Checklist

Before submitting, verify:

- [ ] App deployed to production domain
- [ ] Domain verified in Google Search Console
- [ ] Privacy Policy page live and comprehensive
- [ ] Terms of Service page live and clear
- [ ] OAuth consent screen fully configured
- [ ] Production redirect URIs added
- [ ] Video demo recorded (3-5 minutes, HD)
- [ ] Video shows complete authentication flow
- [ ] Video clearly demonstrates YouTube API usage
- [ ] Video shows subscription verification process
- [ ] Scope justifications written clearly
- [ ] Business purpose explained
- [ ] All features working in production
- [ ] Test user can complete full flow

---

## 📞 During Review Period

### What You Can Do:
- Keep app in "Testing" mode with test users
- Continue development
- Add features
- Fix bugs
- Respond quickly to Google's questions

### What You Should NOT Do:
- Change scope requests
- Modify OAuth consent screen
- Delete the OAuth client
- Change app purpose significantly

---

## ✅ After Approval

1. **Announcement:**
   - App is now public!
   - Anyone with Google account can sign in
   - Remove test user restrictions

2. **Monitor:**
   - Check Google Cloud Console for quota usage
   - Monitor YouTube API calls
   - Watch for abuse or suspicious activity

3. **Maintain Compliance:**
   - Keep privacy policy updated
   - Honor user data deletion requests
   - Respond to user concerns
   - Follow YouTube Terms of Service

---

## 🆘 Need Help?

### Google Support:
- OAuth Support: https://support.google.com/cloud
- YouTube API: https://support.google.com/youtube/answer/7071387

### Useful Resources:
- OAuth Verification Guide: https://support.google.com/cloud/answer/9110914
- YouTube API Compliance: https://developers.google.com/youtube/v3/guides/authentication
- GDPR Compliance: https://developers.google.com/youtube/v3/guides/gdpr

---

## 🎯 Quick Action Steps

**Right Now:**
1. Deploy app to production domain
2. Create privacy policy page
3. Create terms of service page
4. Verify domain in Google Search Console
5. Record video demonstration

**Then:**
1. Update OAuth consent screen
2. Fill verification form
3. Submit application
4. Wait for review

**Estimated Time:** 2-3 hours preparation + 2-6 weeks review

---

**Good luck with your verification! 🚀**
