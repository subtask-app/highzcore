# Contract-Based Messaging System

## Overview

SubTask.ng uses a **contract-based messaging system** where each task/order creates a private chat thread between the client and admin. This replaces traditional support channels like WhatsApp or live chat widgets.

## How It Works

### 1. Task Creation
- When a client creates a new order (task), a messaging thread is automatically associated with that task
- Each task has its own isolated chat conversation
- Only the client who owns the task and admins can access the messages

### 2. Payment Flow via Messages
```
1. Client submits order with YouTube channel details
2. Platform shows bank account details
3. Client makes bank transfer
4. Client uploads payment proof in the task chat
5. Admin receives notification
6. Admin reviews payment proof in chat
7. Admin confirms payment and activates order
8. Both client and admin can continue chatting about this specific order
```

### 3. Message Types

#### Text Messages
- General communication about the order
- Questions from client
- Updates from admin

#### Payment Proof Messages
- Special message type with uploaded screenshot
- Flagged as `is_payment_proof: true`
- Contains `payment_proof_url` pointing to uploaded image
- Triggers admin notification

## Database Structure

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  task_id UUID,                    -- Links to specific order
  sender_id UUID,                  -- Who sent the message
  sender_role user_role,           -- 'client' or 'admin'
  message TEXT,                    -- Message content
  is_payment_proof BOOLEAN,        -- Is this a payment proof upload?
  payment_proof_url TEXT,          -- URL to payment screenshot
  is_read BOOLEAN,                 -- Has it been read?
  created_at TIMESTAMP
);
```

## User Experience

### For Clients

**After Creating an Order:**
1. Redirected to order detail page
2. See bank account details for payment
3. Can send messages to admin about this order
4. Upload payment proof directly in chat
5. Get real-time updates from admin
6. Track progress of this specific order

**UI Components:**
- Order header showing task details
- Message thread below
- Text input for messages
- Upload button for payment proof
- Read receipts

### For Admins

**Admin Dashboard:**
- List of all orders with unread message indicators
- Quick access to orders with pending payments
- Filter orders by status (pending payment, active, completed)

**Order Chat View:**
- Client details
- Order details
- Full message history
- Payment proof images inline
- Action buttons:
  - Confirm Payment → Activates order
  - Reject Payment → Request new proof
  - Send Message → Communicate with client

## Security & Privacy

### Row-Level Security (RLS)
```sql
-- Clients can only view messages for their own tasks
CREATE POLICY "Clients can view messages for their tasks"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = messages.task_id
      AND tasks.client_id = auth.uid()
    )
  );

-- Clients can only send messages for their own tasks
CREATE POLICY "Clients can send messages for their tasks"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
      AND tasks.client_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );
```

### Admin Access
- Admins have access to all message threads (handled in application layer)
- Admin actions are logged with `sender_role = 'admin'`
- All admin responses are timestamped

## Benefits Over Traditional Support

### Vs WhatsApp
✅ No need to share personal phone number
✅ All conversations organized by order
✅ Automatic record keeping
✅ No message loss
✅ Professional appearance

### Vs Live Chat Widgets
✅ No third-party service needed
✅ No monthly subscription costs
✅ Complete data ownership
✅ Context-aware (tied to specific order)
✅ Payment proof integrated

### Vs Email
✅ Faster, real-time communication
✅ No email threading confusion
✅ Embedded in platform
✅ Instant notifications
✅ Better UX for file uploads

## Implementation Checklist

### Frontend Components
- [ ] `MessageThread` - Display messages for a task
- [ ] `MessageInput` - Send text messages
- [ ] `PaymentProofUpload` - Upload screenshot
- [ ] `MessageBubble` - Individual message UI
- [ ] `UnreadBadge` - Show unread count

### API Routes
- [ ] `POST /api/messages` - Send message
- [ ] `GET /api/messages/[taskId]` - Get all messages for task
- [ ] `POST /api/messages/upload` - Upload payment proof
- [ ] `PATCH /api/messages/[id]/read` - Mark as read

### Real-time Updates
- [ ] Supabase Realtime subscriptions for new messages
- [ ] Notification badge updates
- [ ] Auto-scroll to new messages

### Notifications
- [ ] Email notification when admin sends message
- [ ] Email notification to admin when client uploads payment proof
- [ ] In-app notification badge

## Email Integration (Gmail via Supabase)

### Setup Steps
1. Go to Supabase Dashboard → Project Settings → Auth → SMTP Settings
2. Enable custom SMTP
3. Configure Gmail:
   - SMTP Host: `smtp.gmail.com`
   - Port: `587`
   - Username: Your Gmail address
   - Password: App password (not regular password)
4. Sender email: Your Gmail address
5. Sender name: SubTask.ng

### Email Templates
- **New message from admin**: Notify client of response
- **Payment proof uploaded**: Alert admin to review
- **Payment confirmed**: Inform client order is activated
- **Order completed**: Notify client target reached

## File Upload Strategy

### Storage Options
1. **Supabase Storage** (Recommended)
   - Create bucket: `payment-proofs`
   - Public read access
   - Authenticated write access
   - Auto-delete after order completion (optional)

2. **Direct Upload Flow**
   ```
   Client selects image
   → Upload to Supabase Storage
   → Get public URL
   → Save URL in message
   → Display in chat
   ```

## Future Enhancements

### Phase 2
- [ ] Voice messages
- [ ] Video uploads
- [ ] Emoji reactions to messages
- [ ] Message threading/replies
- [ ] Search in messages

### Phase 3
- [ ] Automated responses for common questions
- [ ] Quick reply templates for admin
- [ ] Message templates for clients
- [ ] Typing indicators
- [ ] Delivery receipts

## Example User Flow

### Complete Payment Process

```
CLIENT                           ADMIN
  |                                |
  ├─ Creates order                 |
  ├─ Views bank details            |
  ├─ Makes transfer                |
  ├─ Uploads screenshot ──────────→├─ Receives notification
  ├─ Sends message: "Paid"         ├─ Opens order chat
  |                                ├─ Views payment proof
  |                                ├─ Verifies transfer
  ├←───── Replies: "Confirmed" ────┤
  ├─ Receives notification         ├─ Clicks "Confirm Payment"
  ├─ Order activated               ├─ Order activated
  ├─ Tracks progress               |
  |                                |
  ├─ Asks: "How long?"  ──────────→├─ Replies with estimate
  |                                |
  ├←─── "Target reached!" ─────────┤
  ├─ Order completed               ├─ Marks complete
```

## Cost Comparison

| Solution | Monthly Cost | Features |
|----------|--------------|----------|
| WhatsApp Business | Free | ❌ No organization, ❌ Personal |
| Tawk.to | $19-29 | ✅ Live chat, ❌ No context |
| Intercom | $79+ | ✅ Full featured, ❌ Expensive |
| **Custom System** | **$0** | ✅ Organized, ✅ Context-aware, ✅ Integrated |

## Summary

The contract-based messaging system provides a professional, organized, and cost-effective way to handle client-admin communication. Each order has its own dedicated chat thread, making it easy to track conversations, manage payments, and provide support—all without relying on external services or sharing personal contact information.
