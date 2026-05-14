// FAQ data shared between the marketing pages (which render the accordion)
// and the route layouts (which serialise the same data as JSON-LD for
// Google's FAQ-rich-result feature).
//
// Keep this as the single source of truth — edits land in both surfaces.

export const CREATOR_FAQS = [
  {
    q: 'Are these real subscribers?',
    a: 'Yes — every worker has their own Google account and subscribes through normal YouTube. We then call the YouTube Data API to confirm each subscription before the worker is paid.',
  },
  {
    q: 'Will my channel get demonetized?',
    a: 'No. The risk of demonetization comes from bots and inauthentic activity. Our workers are real people clicking subscribe through the regular YouTube interface — there\'s no signal that distinguishes them from any other organic subscriber.',
  },
  {
    q: 'How long does a campaign take?',
    a: 'Most campaigns complete in 7–14 days. Smaller targets land faster — typically inside a week. We don\'t batch-deliver: subscribers come in as workers claim and verify.',
  },
  {
    q: 'What if someone unsubscribes later?',
    a: 'We monitor verified subscriptions for the lifetime of the campaign. If a worker drops their subscription, their payment is reversed and the slot reopens for someone else.',
  },
  {
    q: 'How do I pay?',
    a: 'Bank transfer. After you create a campaign you\'ll be matched with our team in chat — they\'ll share account details, you send proof, we confirm and the campaign goes live.',
  },
  {
    q: 'Can I get a refund?',
    a: 'If a campaign hasn\'t started yet, yes — full refund. Once it\'s live and subscribers are being delivered, refunds cover the un-delivered portion only.',
  },
] as const;

export const WORKER_FAQS = [
  {
    q: 'How much can I actually make?',
    a: 'It depends entirely on how many tasks you do. Workers earning ₦1,200 a day are doing 10 tasks — usually 30–45 minutes of work total. There\'s no cap. The ceiling is just how many tasks are available at any moment.',
  },
  {
    q: 'Do I need my own YouTube channel?',
    a: 'No. You only need a regular Google account. That account is what you\'ll use to subscribe to creators\' channels — same as anyone else watching YouTube.',
  },
  {
    q: 'When do I get paid?',
    a: 'As soon as a task is verified, your wallet balance goes up. Once you have at least ₦1,000 you can request a withdrawal, and the funds reach your bank within 3 business days.',
  },
  {
    q: 'Is my Google account safe?',
    a: 'Yes. We never automate clicks or scripts on your account. You log in once to authorize our app to read your subscription list (read-only, scoped to YouTube). Every subscribe is done by you, the human, through normal YouTube.',
  },
  {
    q: 'Can I work from outside Nigeria?',
    a: 'Yes — workers from anywhere are welcome, as long as you have a bank account we can pay into. Withdrawals currently route through Nigerian rails fastest; international rails are on our roadmap.',
  },
  {
    q: 'What if I subscribe but it\'s not detected?',
    a: 'YouTube\'s API sometimes takes a minute to reflect a new subscription. If the first check fails, wait 60 seconds and try again from the task page. If it still doesn\'t go through, our team will sort it out in chat.',
  },
] as const;
