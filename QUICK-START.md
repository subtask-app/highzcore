# Quick Start Guide - Setup Everything in 5 Minutes

## ✅ Complete Setup Checklist

Follow these steps in order to get everything working:

---

## Step 1: Database Tables (2 minutes)

Run these SQL files in **Supabase SQL Editor** in this order:

### 1.1 Create Users Table (if not exists)
```bash
File: create-users-table.sql
```

### 1.2 Create Contracts Table
```bash
File: contracts-only-migration.sql
```

### 1.3 Create Messages Table
```bash
File: add-messages-table.sql
```

### 1.4 Add Admin Policies
```bash
File: add-admin-policies.sql
```

✅ **Verify**: Go to Supabase → Table Editor → You should see `users`, `contracts`, `messages` tables

---

## Step 2: Make Yourself Admin (1 minute)

### 2.1 Sign Up First
1. Go to http://localhost:3000/for-clients
2. Click "Get Started"
3. Sign up with your Google account

### 2.2 Set Admin Role
1. Go to **Supabase SQL Editor**
2. Run:
```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@gmail.com';  -- Use your actual email
```

### 2.3 Test Admin Access
1. Log out
2. Log back in
3. Visit: http://localhost:3000/dashboard/admin
4. ✅ You're now admin!

---

## Step 3: Enable Real-Time (1 minute)

### Option A: Via Supabase UI
1. Go to **Database** → **Replication**
2. Enable Realtime for:
   - ✅ contracts
   - ✅ messages

### Option B: Via SQL
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

✅ **Verify**: Send a test message as client, see it appear instantly on admin dashboard

---

## Step 4: Test Everything (1 minute)

### 4.1 Create a Test Order
1. Log in as client: http://localhost:3000/for-clients
2. Create an order
3. ✅ Order appears on admin dashboard instantly

### 4.2 Test Messaging
1. **Client**: Click on order → Messages → Send message
2. **Admin**: Go to Messages tab → See message appear instantly ⚡
3. **Admin**: Click message → Reply
4. **Client**: See reply appear instantly ⚡

✅ **Success!** Everything is working in real-time!

---

## Common Issues & Fixes

### ❌ "Can't see contracts on admin dashboard"
**Fix**: Run `add-admin-policies.sql`

### ❌ "Access Denied: Admin privileges required"
**Fix**:
1. Run: `UPDATE users SET role = 'admin' WHERE email = 'your-email@gmail.com';`
2. Log out and log back in

### ❌ "Messages don't appear in real-time"
**Fix**: Enable realtime in Database → Replication

### ❌ "No tables found"
**Fix**: Run the SQL migration files in order (Step 1)

---

## File Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `create-users-table.sql` | Create users table | If users table doesn't exist |
| `contracts-only-migration.sql` | Create contracts table | Always run this |
| `add-messages-table.sql` | Create messages table | Always run this |
| `add-admin-policies.sql` | Allow admin access | **REQUIRED** - Always run |
| `set-admin-role.sql` | Make users admin | After signup |
| `ADMIN-SETUP.md` | Detailed admin guide | Reference guide |
| `ENABLE-REALTIME.md` | Realtime setup guide | Reference guide |

---

## Production Deployment

Before deploying to production:

1. **Update .env.local**:
   ```bash
   ADMIN_EMAILS=admin1@example.com,admin2@example.com
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Update Google OAuth**:
   - Add production URL to authorized origins
   - Add production callback URLs

3. **Update Supabase**:
   - Change Site URL to production domain
   - Update redirect URLs

4. **Verify RLS Policies**:
   - Test all tables have proper policies
   - Ensure admins can access everything

---

## Next Steps

After setup:
- ✅ Add more admins using `set-admin-role.sql`
- ✅ Configure payment details in .env.local
- ✅ Customize branding (logo, colors, etc.)
- ✅ Test worker signup and task completion flow
- ✅ Set up withdrawal bank account details

---

## 🆘 Need Help?

1. Check browser console (F12) for errors
2. Check Supabase logs
3. Review the detailed guides:
   - `ADMIN-SETUP.md` - Admin configuration
   - `ENABLE-REALTIME.md` - Real-time features

---

## Summary of What You Have

✅ **Unified Navbar** - One navbar for all pages
✅ **Custom Notifications** - Toast notifications (no alerts)
✅ **Admin Dashboard** - Full admin panel
✅ **Real-Time Messaging** - Instant messages between admin & clients
✅ **Admin Management** - Easy to add/remove admins
✅ **Proper RLS Policies** - Secure data access
✅ **Database Schema** - All tables configured

**You're all set! 🚀**
