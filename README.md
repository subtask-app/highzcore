# Highzcore - YouTube Growth Marketplace

A two-sided marketplace connecting YouTube content creators in Nigeria with workers who help them reach the 1,000 subscriber threshold needed for monetization.

## 🎯 What Is Highzcore?

**For Creators**: Pay to get real subscribers from real people to reach YouTube's monetization requirement faster.

**For Workers**: Earn ₦120 per task by subscribing to YouTube channels with your Google account.

**For the Platform**: Take a 20% fee from each transaction to maintain the platform and provide support.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Google Cloud account (for YouTube API)
- A Resend account (for emails)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd highzcore-app
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual credentials
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL from `supabase-schema.sql` in the SQL Editor
   - Copy your project URL and keys to `.env.local`

4. **Set up Google Cloud**
   - See detailed instructions in `SETUP_GUIDE.md` Step 2
   - Enable YouTube Data API v3
   - Create OAuth credentials
   - Add credentials to `.env.local`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## 📖 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current progress and next steps
- **SubTask Business Overview.docx** - Business model explained
- **SubTask Business Documentation.docx** - Technical specifications

## 🏗️ Current Status

**✅ Completed (30%)**:
- Next.js project initialized
- Database schema designed
- Supabase integration configured
- Landing page with pricing calculator
- Type definitions and utilities

**🚧 In Progress**:
- Authentication system
- Worker dashboard
- Client dashboard
- Admin dashboard
- YouTube API integration

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for full details.

## 💡 Features

### For Creators
- Choose from preset packages or custom orders
- Track real-time subscriber progress
- Transparent pricing (₦150 per subscriber)
- Manual payment with bank transfer
- Email notifications

### For Workers
- Sign in with Google account
- Browse available tasks
- Earn ₦120 per task instantly
- Withdraw to Nigerian bank account
- No special skills required

### For Admins
- Manual payment confirmation
- Automated task distribution
- Withdrawal processing queue
- User management
- Analytics dashboard

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Google OAuth
- **API**: YouTube Data API v3
- **Email**: Resend
- **Deployment**: Vercel

## 📁 Project Structure

```
subtask-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page ✓
│   │   ├── login/              # (To be built)
│   │   ├── signup/             # (To be built)
│   │   ├── dashboard/          # (To be built)
│   │   ├── admin/              # (To be built)
│   │   └── api/                # API routes (To be built)
│   ├── components/             # Reusable React components
│   ├── lib/                    # Utility functions
│   │   ├── supabase/           # Supabase clients ✓
│   │   └── utils.ts            # Helper functions ✓
│   ├── types/                  # TypeScript type definitions ✓
│   └── middleware.ts           # Auth middleware ✓
├── public/                     # Static files
├── supabase-schema.sql         # Database schema ✓
└── SETUP_GUIDE.md              # Setup instructions ✓
```

## 🔐 Security

- All subscriptions verified via official YouTube API
- Row-level security (RLS) enabled on all database tables
- Google OAuth for authentication
- Encrypted OAuth tokens in database
- Manual payment confirmation to prevent fraud

## 💰 Pricing

| Package | Subscribers | Price |
|---------|-------------|-------|
| Starter | 100 | ₦15,000 |
| Growth | 500 | ₦75,000 |
| Standard | 1,000 | ₦150,000 |
| Premium | 2,000 | ₦280,000 |
| Custom | Variable | ₦150/subscriber |

**Worker Rate**: ₦120 per task
**Platform Fee**: 20%

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. Contact the owner for collaboration opportunities.

## 📧 Support

For setup help: See `SETUP_GUIDE.md`
For business questions: See business documentation files
For bugs or issues: Contact the development team

---

**Built with ❤️ for Nigerian content creators and earners**
# highzcore
