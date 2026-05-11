# Admin Setup Guide

## How to Create Admin Users

### Step 1: Sign Up First
Before making someone an admin, they must create an account:

1. Go to http://localhost:3000/for-clients (or for-workers, doesn't matter)
2. Click "Get Started" or "Login"
3. Sign up with Google OAuth using the email you want to make admin
4. Complete the signup process

### Step 2: Set Admin Role in Database

#### Method 1: Using SQL Editor (Recommended)
1. Go to your **Supabase Dashboard** → SQL Editor
2. Open the file `set-admin-role.sql` in your project
3. Copy the SQL and modify the email:
   ```sql
   UPDATE users
   SET role = 'admin'
   WHERE email = 'your-actual-email@gmail.com';
   ```
4. Click **Run** in Supabase SQL Editor
5. You should see "Success. 1 row updated"

#### Method 2: Using Supabase Table Editor
1. Go to your **Supabase Dashboard** → Table Editor
2. Click on the `users` table
3. Find the row with your email
4. Click on the `role` cell
5. Change it from `client` or `worker` to `admin`
6. Press Enter to save

### Step 3: Access Admin Dashboard
1. Log out from your current session
2. Log back in with the admin account
3. Navigate to: http://localhost:3000/dashboard/admin
4. You should now see the admin dashboard!

---

## Managing Multiple Admins

### Add Multiple Admins at Once
```sql
UPDATE users
SET role = 'admin'
WHERE email IN (
  'admin1@gmail.com',
  'admin2@gmail.com',
  'admin3@gmail.com'
);
```

### Check Current Admins
```sql
SELECT id, email, full_name, role, created_at
FROM users
WHERE role = 'admin';
```

### Remove Admin Access
```sql
UPDATE users
SET role = 'client'  -- or 'worker'
WHERE email = 'former-admin@gmail.com';
```

---

## Admin Capabilities

Once you're an admin, you can:

✅ **View All Contracts** - See all client orders
✅ **Manage Withdrawals** - Approve/reject worker payout requests
✅ **Reply to Messages** - Chat with clients about their orders
✅ **View Statistics** - Monitor platform activity
✅ **Manage Users** - View user statistics

---

## Security Best Practices

### 1. Limit Admin Access
- Only give admin role to trusted team members
- Use real email addresses (not temporary/disposable)
- Don't share admin credentials

### 2. Regular Access Review
Periodically check who has admin access:
```sql
SELECT email, full_name, created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;
```

### 3. Activity Monitoring
- Admins should log their actions
- Keep track of who approves what
- Consider adding audit logs in the future

---

## Troubleshooting

### "Access Denied: Admin privileges required"
**Problem**: User tries to access admin dashboard but gets redirected

**Solutions**:
1. Check if user's role is set to `admin` in the database
2. Make sure user logged out and logged back in after role change
3. Clear browser cache and cookies
4. Verify the email matches exactly (case-sensitive)

### Admin Dashboard Won't Load
**Problem**: Dashboard shows loading spinner forever

**Solutions**:
1. Check browser console for errors (F12)
2. Verify all database tables exist (contracts, messages, etc.)
3. Run the database migrations if not done yet
4. Check Supabase connection

### Can't Update Role in Database
**Problem**: SQL query doesn't update the role

**Solutions**:
1. Make sure the user signed up first (row exists in `users` table)
2. Check Row Level Security (RLS) policies
3. Use the Supabase service role key for direct updates
4. Verify the email spelling is correct

---

## Quick Reference

### Your First Admin Setup (Step by Step)

1. **Sign up** at http://localhost:3000/for-clients → "Get Started"
2. **Go to Supabase** → SQL Editor
3. **Run this** (replace with your email):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'YOUR_EMAIL@gmail.com';
   ```
4. **Log out** from the app
5. **Log back in**
6. **Visit** http://localhost:3000/dashboard/admin
7. **Success!** You're now an admin 🎉

---

## Need Help?

If you encounter issues:
1. Check the browser console (F12)
2. Check Supabase logs
3. Verify all environment variables are set
4. Ensure database migrations are complete

For more advanced admin features, consider:
- Creating an admin invite system
- Adding 2FA for admin accounts
- Implementing admin activity logs
- Setting up email notifications for admin actions
