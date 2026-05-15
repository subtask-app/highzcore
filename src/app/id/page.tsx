import { CountryPage } from '@/components/marketing/CountryPage';

export const metadata = {
  title: 'Highzcore for Indonesian YouTube creators',
  description: 'Audience feedback, thumbnail testing, and real promotion for Indonesian creators. USDT payouts for workers.',
  alternates: { canonical: '/id' },
};

export default function IndonesiaPage() {
  return (
    <CountryPage
      countryCode="ID"
      countryName="Indonesia"
      callout="Built for Indonesian creators."
      language="Bahasa Indonesia + English"
      highlightCreators="Test in Bahasa Indonesia. Reach real Indonesian audiences."
      highlightWorkers="Earn USDT — withdraw to any TRC20 wallet."
      topNiches={['Gaming', 'Comedy & Sketch', 'Tech & Reviews', 'Beauty & Fashion', 'Education', 'Cooking', 'Lifestyle', 'Music']}
    />
  );
}
