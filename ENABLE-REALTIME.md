# Enable Real-Time Updates

## Why Real-Time?

With real-time enabled:
- ✅ Admin sees new client messages **instantly**
- ✅ Client sees admin replies **instantly**
- ✅ Contract updates appear **without refresh**
- ✅ New orders appear on admin dashboard **immediately**
- ✅ Withdrawal requests show up **in real-time**

---

## Step 1: Enable Realtime in Supabase

### Method 1: Enable for All Tables (Recommended)

1. Go to **Supabase Dashboard**
2. Click on **Database** → **Replication**
3. Find each table and toggle **Realtime** ON:
   - ✅ `contracts`
   - ✅ `messages`
   - ✅ `users`
   - ✅ `withdrawals` (if exists)
   - ✅ `transactions` (if exists)

### Method 2: Enable via SQL

Run this in your **Supabase SQL Editor**:

```sql
-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Optional tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'withdrawals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
END $$;
```

---

## Step 2: Run Admin Policies SQL

To allow admin to see contracts and messages, run this:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy content from `add-admin-policies.sql`
3. Click **Run**
4. You should see "✅ Admin policies created successfully!"

---

## Step 3: Test Real-Time

### Test Admin → Client Messages

1. **Open TWO browser windows**:
   - Window 1: Admin dashboard → Messages tab
   - Window 2: Client dashboard → Click on a contract → Messages

2. **From Client**: Send a message
3. **Watch Admin**: Message appears instantly! ⚡

### Test Client ← Admin Messages

1. **Admin**: Click on a message to reply
2. **Admin**: Type reply and click Send
3. **Client**: Reply appears instantly in their messages! ⚡

---

## Troubleshooting

### Messages Don't Appear in Real-Time

**Check 1: Is Realtime Enabled?**
```sql
-- Run this to check which tables have realtime enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

You should see `contracts` and `messages` in the results.

**Check 2: Browser Console**
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for messages like:
   ```
   Message update: {new: {...}}
   Contract update: {new: {...}}
   ```

If you see these, realtime is working!

**Check 3: Admin Can't See Contracts?**
Make sure you ran `add-admin-policies.sql`. Run this to verify:
```sql
SELECT policyname FROM pg_policies
WHERE tablename = 'contracts'
AND policyname LIKE '%Admin%';
```

### "Realtime is disabled for this table"

This means you need to enable it in Supabase:
1. Go to Database → Replication
2. Find the table
3. Toggle Realtime ON
4. Wait 10 seconds and try again

### Real-Time Works But No Data Shows

**For Admin**: Run `add-admin-policies.sql`

**For Client**: Check if they're logged in as the contract owner

---

## How It Works

### Admin Dashboard
```typescript
// Listens for any changes to messages table
supabase
  .channel('admin-messages')
  .on('postgres_changes', {
    event: '*',  // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    // Auto-refresh when message is added/updated
    fetchDashboardData();
  })
  .subscribe();
```

### Client Dashboard
```typescript
// Listens for messages on their contracts
supabase
  .channel('client-messages')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    // If message is for their contract, refresh
    if (payload.new?.contract_id === selectedContract.id) {
      fetchMessages(selectedContract.id);
    }
  })
  .subscribe();
```

---

## Performance Notes

### Bandwidth Usage
- Real-time uses WebSockets (very efficient)
- Only sends changed rows, not entire table
- ~1-5 KB per message update
- Negligible impact on performance

### Free Tier Limits
Supabase Free Tier includes:
- ✅ **500 MB** database
- ✅ **Unlimited** realtime connections
- ✅ **2 GB** bandwidth per month
- ✅ **50 GB** bandwidth for realtime

For your use case, this is **more than enough**!

---

## Advanced: Filtering Real-Time Events

If you want to only listen to specific contracts:

```typescript
// Only listen to messages for specific client
supabase
  .channel(`client-${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `contract_id=eq.${contractId}`
  }, handleUpdate)
  .subscribe();
```

---

## Quick Checklist

Before testing real-time:
- [ ] Realtime enabled for `contracts` table
- [ ] Realtime enabled for `messages` table
- [ ] Ran `add-admin-policies.sql`
- [ ] Set admin role for your user
- [ ] Opened browser console to see logs
- [ ] Tested with 2 browser windows

---

## What's Already Configured

✅ **Admin Dashboard**: Real-time for messages, contracts, withdrawals
✅ **Client Dashboard**: Real-time for messages and contracts
✅ **Auto-cleanup**: Subscriptions are properly cleaned up on unmount
✅ **Console logging**: See real-time events in browser console

Just enable it in Supabase and you're done! 🚀
