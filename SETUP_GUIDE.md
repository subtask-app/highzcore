# SubTask.ng Setup Guide

This guide will walk you through setting up the SubTask.ng platform from scratch.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- A Google Cloud account
- A Resend account (for email notifications)

## Step 1: Set Up Supabase

1. **Create a new Supabase project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose an organization and give your project a name (e.g., "subtask-ng")
   - Set a strong database password
   - Select a region close to your target users (Nigeria - choose EU West if Africa not available)
   - Wait for the project to be created (~2 minutes)

2. **Run the database schema**
   - Go to the SQL Editor in your Supabase dashboard
   - Click "New Query"
   - Copy the contents of `supabase-schema.sql` from the project root
   - Paste it into the SQL editor and click "Run"
   - You should see a success message

3. **Get your Supabase credentials**
   - Go to Project Settings → API
   - Copy the following values:
     - `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 2: Set Up Google Cloud & YouTube API

1. **Create a Google Cloud Project**
   - Go to [https://console.cloud.google.com](https://console.cloud.google.com)
   - Click "Select a project" → "New Project"
   - Name it "SubTask" and click "Create"

2. **Enable YouTube Data API v3**
   - In the Google Cloud Console, go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click on it and click "Enable"

3. **Create API Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key → This is your `YOUTUBE_API_KEY`
   - Click "Restrict Key" and under "API restrictions", select "YouTube Data API v3"

4. **Set up OAuth 2.0 for Google Sign-In**
   - In "Credentials", click "Create Credentials" → "OAuth 2.0 Client ID"
   - If prompted, configure the OAuth consent screen first:
     - User Type: External
     - App name: SubTask.ng
     - User support email: your email
     - Developer contact: your email
   - Add the scopes:
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Save and continue
   - Back in "Credentials", create OAuth 2.0 Client ID:
     - Application type: Web application
     - Name: SubTask Web Client
     - Authorized JavaScript origins: `http://localhost:3000` (add production URL later)
     - Authorized redirect URIs: `http://localhost:3000/auth/callback`
   - Copy the Client ID → `GOOGLE_CLIENT_ID`
   - Copy the Client Secret → `GOOGLE_CLIENT_SECRET`

5. **Configure Google OAuth in Supabase**
   - Go to your Supabase project → Authentication → Providers
   - Enable "Google" provider
   - Paste your Google Client ID and Client Secret
   - Copy the Redirect URL shown (e.g., `https://your-project.supabase.co/auth/v1/callback`)
   - Go back to Google Cloud Console → Credentials → Your OAuth Client
   - Add the Supabase redirect URL to "Authorized redirect URIs"

## Step 3: Set Up Resend for Email Notifications

1. **Create a Resend account**
   - Go to [https://resend.com](https://resend.com)
   - Sign up for a free account

2. **Get your API key**
   - Go to API Keys in the Resend dashboard
   - Click "Create API Key"
   - Name it "SubTask Production"
   - Copy the key → This is your `RESEND_API_KEY`

3. **Verify your domain (Optional for production)**
   - For testing, you can use Resend's testing email addresses
   - For production, add and verify your domain (e.g., subtask.ng)

## Step 4: Configure Environment Variables

1. **Create `.env.local` file**
   - Copy `.env.local.example` to `.env.local`
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in all the values** you collected from the steps above

3. **Update bank account details** in `.env.local` with your actual business bank account

## Step 5: Install Dependencies and Run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You should see the SubTask landing page

## Step 6: Create Your First Admin User

1. **Sign up with Google** on the platform
2. **Go to your Supabase project** → Table Editor → `users` table
3. **Find your user** and change the `role` column from `worker` to `admin`
4. **Refresh your browser** and you should now see the Admin Dashboard option

## Step 7: Test the Platform

1. **Create a test client account**
   - Sign up with a different Google account
   - Submit a test order (small package)
   - Upload a fake payment screenshot

2. **As admin, confirm the payment**
   - Go to Admin Dashboard
   - Find the pending payment
   - Activate the order

3. **Create a test worker account**
   - Sign up with another Google account
   - Browse available tasks
   - Complete a task
   - Check if wallet is credited

4. **Test withdrawal flow**
   - As worker, request a withdrawal
   - As admin, process the withdrawal

## Deployment to Vercel

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Click "Deploy"

3. **Update OAuth redirect URLs**
   - Once deployed, copy your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Go to Google Cloud Console → Credentials
   - Add your production URL to "Authorized JavaScript origins"
   - Add `https://your-app.vercel.app/auth/callback` to redirect URIs

4. **Update Supabase Google OAuth config**
   - In Supabase Auth settings, ensure the Google provider has your production redirect URL

## Next Steps

- Customize the landing page with your brand
- Add your actual bank account details
- Set up a custom domain
- Test with real users
- Monitor the admin dashboard regularly
- Set up proper backup procedures for your database

## Support

If you encounter any issues during setup, check:
- All environment variables are set correctly
- Google OAuth redirect URLs match exactly
- Supabase RLS policies are enabled
- API keys are not expired

For further help, consult the documentation for:
- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [YouTube Data API](https://developers.google.com/youtube/v3)
