// Shared option catalogs for onboarding pickers. Kept as plain TS so the
// worker + creator wizards and the marketing site share the same vocabulary.

export interface Option {
  value: string;
  label: string;
}

// Countries — supported launch markets first, then "Other" so we can capture
// signups from elsewhere and expand later.
export const COUNTRIES: Option[] = [
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'PH', label: 'Philippines' },
  { value: 'KE', label: 'Kenya' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'EG', label: 'Egypt' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'OTHER', label: 'Other' },
];

// Languages — ISO-639-1 codes, ordered to match supported UI locales first.
export const LANGUAGES: Option[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'ta', label: 'Tamil' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'ig', label: 'Igbo' },
  { value: 'ha', label: 'Hausa' },
  { value: 'tw', label: 'Twi' },
  { value: 'sw', label: 'Swahili' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Mandarin' },
];

// Niches — broad enough to cover most YouTube channels, narrow enough for
// matching. Single-select for creators, multi-select for workers.
export const NICHES: Option[] = [
  { value: 'gaming',          label: 'Gaming' },
  { value: 'tech',            label: 'Tech & Reviews' },
  { value: 'finance',         label: 'Finance & Crypto' },
  { value: 'business',        label: 'Business & Entrepreneurship' },
  { value: 'education',       label: 'Education & Tutorials' },
  { value: 'science',         label: 'Science' },
  { value: 'health',          label: 'Health & Fitness' },
  { value: 'beauty',          label: 'Beauty & Fashion' },
  { value: 'food',            label: 'Food & Cooking' },
  { value: 'travel',          label: 'Travel & Lifestyle' },
  { value: 'comedy',          label: 'Comedy & Sketch' },
  { value: 'music',           label: 'Music' },
  { value: 'film',            label: 'Film & Cinema' },
  { value: 'sports',          label: 'Sports' },
  { value: 'news',            label: 'News & Commentary' },
  { value: 'politics',        label: 'Politics & Social' },
  { value: 'religion',        label: 'Religion & Faith' },
  { value: 'gospel',          label: 'Gospel' },
  { value: 'art',             label: 'Art & DIY' },
  { value: 'photography',     label: 'Photography & Videography' },
  { value: 'cars',            label: 'Cars & Motors' },
  { value: 'parenting',       label: 'Parenting & Family' },
  { value: 'kids',            label: 'Kids' },
  { value: 'pets',            label: 'Pets & Animals' },
  { value: 'anime',           label: 'Anime & Manga' },
  { value: 'kdrama',          label: 'K-Drama & K-Pop' },
  { value: 'bollywood',       label: 'Bollywood' },
  { value: 'nollywood',       label: 'Nollywood' },
  { value: 'self-improvement',label: 'Self-Improvement' },
  { value: 'productivity',    label: 'Productivity' },
];

// Subscriber brackets — match the schema enum.
export const SUBSCRIBER_BRACKETS: Option[] = [
  { value: '0-1k',    label: 'Under 1,000' },
  { value: '1k-10k',  label: '1,000–10,000' },
  { value: '10k-100k',label: '10,000–100,000' },
  { value: '100k+',   label: '100,000+' },
];

// Upload cadence.
export const UPLOAD_CADENCES: Option[] = [
  { value: 'less_than_1', label: 'Less than 1/month' },
  { value: '1_to_4',      label: '1–4 a month' },
  { value: '5_to_8',      label: '5–8 a month' },
  { value: '9_plus',      label: '9 or more a month' },
];

// Growth goals — what the creator wants out of Highzcore.
export const GROWTH_GOALS: Option[] = [
  { value: 'more_subscribers',  label: 'More subscribers' },
  { value: 'more_views',        label: 'More views per video' },
  { value: 'better_thumbnails', label: 'Better thumbnails + titles' },
  { value: 'audience_feedback', label: 'Honest audience feedback' },
  { value: 'find_collabs',      label: 'Find collab partners' },
  { value: 'monetization',      label: 'Reach monetization' },
];

// Worker devices.
export const DEVICES: Option[] = [
  { value: 'mobile',  label: 'Mobile phone' },
  { value: 'laptop',  label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
];

// Hours-per-day range.
export const HOURS_OPTIONS: Option[] = [
  { value: '1',  label: 'Under 1 hour' },
  { value: '2',  label: '1–2 hours' },
  { value: '4',  label: '2–4 hours' },
  { value: '6',  label: '4–6 hours' },
  { value: '8',  label: '6+ hours' },
];

// "How did you hear about us" — used on both forms.
export const REFERRAL_SOURCES: Option[] = [
  { value: 'twitter',      label: 'Twitter / X' },
  { value: 'youtube',      label: 'YouTube' },
  { value: 'tiktok',       label: 'TikTok' },
  { value: 'instagram',    label: 'Instagram' },
  { value: 'telegram',     label: 'Telegram channel / group' },
  { value: 'friend',       label: 'A friend told me' },
  { value: 'google',       label: 'Google search' },
  { value: 'creator',      label: 'A creator I follow' },
  { value: 'press',        label: 'Press / news article' },
  { value: 'other',        label: 'Other' },
];
