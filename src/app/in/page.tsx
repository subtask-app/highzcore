import { CountryPage } from '@/components/marketing/CountryPage';

export const metadata = {
  title: 'Highzcore for Indian YouTube creators',
  description: 'Audience feedback, thumbnail testing, and real promotion for Indian creators. USDT payouts for workers.',
  alternates: { canonical: '/in' },
};

export default function IndiaPage() {
  return (
    <CountryPage
      countryCode="IN"
      countryName="India"
      callout="Built for Indian creators."
      language="Hindi + English + Tamil + more"
      highlightCreators="Test in Hindi or Tamil. Match your real audience."
      highlightWorkers="Earn USDT — withdraw to any TRC20 wallet."
      topNiches={['Bollywood', 'Tech & Reviews', 'Finance & Crypto', 'Education & Tutorials', 'Gaming', 'Food & Cooking', 'Comedy & Sketch', 'Music']}
    />
  );
}
