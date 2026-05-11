# Google Cloud Setup Guide for Highzcore

This guide will walk you through setting up Google Cloud, enabling YouTube Data API v3, and configuring OAuth for Supabase.

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Project name: `Highzcore` (or your preferred name)
   - Click "Create"
   - Wait for the project to be created (takes a few seconds)

## Step 2: Enable YouTube Data API v3

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"
   - Or visit: https://console.cloud.google.com/apis/library

2. **Search and Enable YouTube API**
   - In the search box, type "YouTube Data API v3"
   - Click on "YouTube Data API v3" from the results
   - Click the blue "Enable" button
   - Wait for it to enable (takes a few seconds)

## Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - In left sidebar: "APIs & Services" → "OAuth consent screen"
   - Or visit: https://console.cloud.google.com/apis/credentials/consent

2. **Choose User Type**
   - Select "External" (allows any Google user to sign in)
   - Click "Create"

3. **Fill App Information** (OAuth consent screen - Step 1)
   ```
   App name: Highzcore
   User support email: [Your email]
   App logo: [Optional - upload your logo]

   Application home page: https://yourdomain.com (or http://localhost:3002 for testing)

   Authorized domains:
   - yourdomain.com (if you have a domain)
   - [Leave empty for localhost testing]

   Developer contact information: [Your email]
   ```
   - Click "Save and Continue"

4. **Scopes** (Step 2)
   - Click "Add or Remove Scopes"
   - Find and select these scopes:
     * `userinfo.email`
     * `userinfo.profile`
     * `openid`
   - In "Manually add scopes" field, add:
     * `https://www.googleapis.com/auth/youtube.readonly`
   - Click "Update"
   - Click "Save and Continue"

5. **Test Users** (Step 3)
   - Click "Add Users"
   - Add your email and any test user emails
   - Click "Add"
   - Click "Save and Continue"

6. **Summary** (Step 4)
   - Review your settings
   - Click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - In left sidebar: "APIs & Services" → "Credentials"
   - Or visit: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Client ID**
   - Click "+ Create Credentials" at the top
   - Select "OAuth client ID"

3. **Configure OAuth Client**
   - Application type: "Web application"
   - Name: `Highzcore Web Client`

   **Authorized JavaScript origins:**
   ```
   http://localhost:3002
   https://yourdomain.com (add when you deploy)
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:3002/auth/callback
   https://yourdomain.com/auth/callback (add when you deploy)
   ```

   **For Supabase (IMPORTANT):**
   Also add this redirect URI:
   ```
   https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback
   ```

   To find your Supabase project ID:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings → API
   - Look for "Project URL" - it will be like: `https://xxxxxxxxxxxxx.supabase.co`
   - The `xxxxxxxxxxxxx` part is your project ID

   - Click "Create"

4. **Save Your Credentials**
   - A modal will appear with your credentials
   - **Copy and save these immediately:**
     * Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
     * Client Secret (looks like: `GOCSPX-xxxxxxxxxxxxx`)
   - Click "OK"

## Step 5: Configure Supabase Authentication

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your Highzcore project

2. **Enable Google Provider**
   - Go to "Authentication" → "Providers"
   - Find "Google" in the list
   - Toggle it to "Enabled"

3. **Add Google Credentials**
   - Paste your Google OAuth Client ID
   - Paste your Google OAuth Client Secret
   - Click "Save"

## Step 6: Update Environment Variables

Add these to your `.env.local` file:

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# YouTube API (optional - for server-side API calls)
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
YOUTUBE_API_KEY=your_youtube_api_key_here
```

## Step 7: (Optional) Create YouTube API Key

If you need to make YouTube API calls from your server:

1. **Go to Credentials**
   - In Google Cloud Console: "APIs & Services" → "Credentials"

2. **Create API Key**
   - Click "+ Create Credentials"
   - Select "API key"
   - Copy the API key
   - Click "Restrict Key" (recommended)

3. **Restrict API Key**
   - Name: `Highzcore YouTube API Key`
   - Application restrictions: Select "HTTP referrers (web sites)"
   - Add your domain(s)
   - API restrictions: Select "Restrict key"
   - Select "YouTube Data API v3"
   - Click "Save"

## Step 8: Test Your Setup

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test Google Sign-In**
   - Go to http://localhost:3002/signup
   - Click "Sign up with Google"
   - You should be redirected to Google's OAuth consent screen
   - Authorize the app
   - You should be redirected back to your dashboard

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Go back to Google Cloud Console → Credentials
- Edit your OAuth client
- Make sure the redirect URI exactly matches: `http://localhost:3002/auth/callback`
- Also add the Supabase callback URL

### Error: "Access blocked: This app's request is invalid"
- Make sure you completed the OAuth consent screen setup
- Add yourself as a test user
- Make sure you enabled the correct scopes

### Error: "The OAuth client was not found"
- Double-check your Client ID in Supabase
- Make sure there are no extra spaces or characters

### Users can't sign up (App not verified)
- During development, this is normal
- Add users to the "Test users" list in OAuth consent screen
- For production, you'll need to submit for verification (takes 1-2 weeks)

## Important Notes

1. **Development vs Production**
   - In development, only test users can sign in
   - When you're ready to launch, you'll need to:
     * Publish your app in OAuth consent screen
     * Submit for verification
     * Add production redirect URIs

2. **Security**
   - Never commit your Client Secret to Git
   - Keep your `.env.local` file private
   - Use different OAuth clients for development and production

3. **Quota Limits**
   - YouTube Data API has daily quota limits
   - Default is 10,000 units per day
   - A subscription check costs ~1-3 units
   - Monitor usage in Google Cloud Console

## Next Steps

After completing this setup:
1. Test authentication flow (signup/login)
2. Verify Google tokens are being stored in database
3. Implement YouTube subscription verification
4. Test worker task verification flow

## Quick Reference

**Google Cloud Console:** https://console.cloud.google.com/
**Supabase Dashboard:** https://supabase.com/dashboard
**YouTube API Docs:** https://developers.google.com/youtube/v3

---

**Need Help?**
- Google OAuth Setup: https://support.google.com/cloud/answer/6158849
- Supabase Auth Docs: https://supabase.com/docs/guides/auth/social-login/auth-google
- YouTube API: https://developers.google.com/youtube/v3/getting-started
