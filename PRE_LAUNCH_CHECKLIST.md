# Pre-Launch Checklist for SubTask.ng

## ✅ What You've Completed

- [x] Next.js project initialized
- [x] Database schema created (`supabase-schema.sql`)
- [x] Landing page built
- [x] Gmail SMTP configured in Supabase
- [x] Environment variables template created

---

## 🔧 Required Setup Before Testing

### 1. Supabase Database Schema
**Status**: ⚠️ NEEDS TO BE RUN

**Action Required**:
1. Go to your Supabase project
2. Click on **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste and click **RUN**
6. Verify all tables were created (check Table Editor)

**Expected Tables**:
- users
- tasks
- completions
- withdrawals
- transactions
- messages

---

### 2. Environment Variables
**Status**: ⚠️ NEEDS CONFIGURATION

**Action Required**:
Edit `.env.local` with your actual values:

```bash
# From Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# From Google Cloud Console (if ready, otherwise skip for now)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_API_KEY=your_youtube_api_key

# Your bank details
BANK_ACCOUNT_NAME=SubTask NG
BANK_ACCOUNT_NUMBER=1234567890
BANK_NAME=First Bank
BANK_ACCOUNT_TYPE=Savings
```

---

### 3. Google Cloud Setup (Optional for Initial Test)
**Status**: ⏸️ CAN SKIP FOR NOW

You can test the landing page and basic setup without Google OAuth. But you'll need this before:
- Users can sign up
- Workers can complete tasks
- YouTube API verification works

**When you're ready**, follow: `SETUP_GUIDE.md` → Step 2

---

### 4. Create Your First Admin User
**Status**: ⚠️ REQUIRED AFTER SIGNUP

**Action Required** (After Google OAuth is set up):
1. Sign up with your Google account
2. Go to Supabase → Table Editor → `users` table
3. Find your user record
4. Change `role` from `worker` to `admin`
5. Refresh the app - you'll now see admin features

---

## 🧪 What You Can Test Right Now

### With Current Setup (No Google OAuth):

1. **Landing Page** ✅
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```
   - [x] View pricing calculator
   - [x] Interact with slider
   - [x] See all sections
   - [x] Check responsive design

2. **Database Connection** ✅
   - Run the schema
   - Check if tables exist
   - Verify RLS policies are enabled

3. **Environment Variables** ✅
   - Confirm Supabase connection works
   - Test if email sending works (if Gmail is configured)

### Cannot Test Yet (Requires Google OAuth):
- ❌ User signup/login
- ❌ Worker dashboard
- ❌ Client dashboard
- ❌ Admin dashboard
- ❌ Task creation
- ❌ YouTube verification

---

## 📋 Complete Setup Order

### Phase 1: Basic Testing (Do This Now)
1. ✅ Run database schema in Supabase
2. ✅ Add Supabase keys to `.env.local`
3. ✅ Add bank details to `.env.local`
4. ✅ Run `npm run dev`
5. ✅ Test landing page at http://localhost:3000

### Phase 2: Enable Authentication (Do This Next)
1. ⏸️ Set up Google Cloud project
2. ⏸️ Enable YouTube Data API v3
3. ⏸️ Create OAuth credentials
4. ⏸️ Add to Supabase Auth settings
5. ⏸️ Add Google keys to `.env.local`
6. ⏸️ Test signup/login

### Phase 3: Build Features (After Auth Works)
1. ⏸️ Build authentication pages
2. ⏸️ Build worker dashboard
3. ⏸️ Build client dashboard
4. ⏸️ Build admin dashboard
5. ⏸️ Build messaging system
6. ⏸️ Integrate YouTube API

---

## 🚀 Quick Start Commands

### 1. Run the database schema
```sql
-- Go to Supabase SQL Editor and run supabase-schema.sql
```

### 2. Set up environment
```bash
# Copy and edit with your values
cp .env.local.example .env.local
nano .env.local  # or use any text editor
```

### 3. Start development server
```bash
npm run dev
```

### 4. Open in browser
```
http://localhost:3000
```

---

## ❓ Common Issues

### Issue: "Environment variables not found"
**Fix**: Make sure `.env.local` exists and has the correct variable names

### Issue: "Cannot connect to Supabase"
**Fix**:
1. Check if `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check if `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Make sure there are no extra spaces in `.env.local`

### Issue: "Tables don't exist"
**Fix**: Run the `supabase-schema.sql` in Supabase SQL Editor

### Issue: "Login/Signup doesn't work"
**Expected**: You haven't set up Google OAuth yet. That's Phase 2.

---

## 📞 What to Test First

### Test 1: Landing Page (5 minutes)
- [ ] Page loads without errors
- [ ] Pricing calculator works
- [ ] All sections visible
- [ ] Links present (even if they don't work yet)

### Test 2: Database (5 minutes)
- [ ] All tables created in Supabase
- [ ] RLS policies enabled
- [ ] Indexes created

### Test 3: Environment (2 minutes)
- [ ] No console errors about missing env vars
- [ ] Dev server starts successfully

---

## ✨ Current Status Summary

**What Works**:
- ✅ Landing page with pricing calculator
- ✅ Database schema ready
- ✅ Gmail email sending configured
- ✅ Project structure set up

**What's Pending**:
- ⏸️ Google OAuth setup
- ⏸️ YouTube API setup
- ⏸️ Dashboard pages
- ⏸️ Messaging system UI
- ⏸️ Payment flow

**Next Immediate Steps**:
1. Run database schema in Supabase (5 min)
2. Add Supabase keys to `.env.local` (2 min)
3. Test landing page (2 min)
4. If all good → Set up Google OAuth (1-2 hours)

---

## 🎯 Ready to Test?

Run these commands in order:

```bash
# 1. Make sure you're in the project directory
cd subtask-app

# 2. Start the dev server
npm run dev

# 3. Open browser
# Visit: http://localhost:3000
```

If the landing page loads and the pricing calculator works, you're ready for Phase 2!
