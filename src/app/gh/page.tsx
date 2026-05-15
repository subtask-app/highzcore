import { CountryPage } from '@/components/marketing/CountryPage';

export const metadata = {
  title: 'Highzcore for Ghanaian YouTube creators',
  description: 'Audience feedback, thumbnail testing, and real promotion for Ghanaian creators. USDT payouts for workers.',
  alternates: { canonical: '/gh' },
};

export default function GhanaPage() {
  return (
    <CountryPage
      countryCode="GH"
      countryName="Ghana"
      callout="Built for Ghanaian creators."
      language="English + Twi"
      highlightCreators="Real Ghanaian audiences testing your videos."
      highlightWorkers="Earn USDT — withdraw to any TRC20 wallet."
      topNiches={['Gospel', 'Music', 'Comedy & Sketch', 'Beauty & Fashion', 'Tech & Reviews', 'Education', 'Lifestyle']}
    />
  );
}
