import { CountryPage } from '@/components/marketing/CountryPage';

export const metadata = {
  title: 'Highzcore for Singaporean YouTube creators',
  description: 'Audience feedback, thumbnail testing, and real promotion for Singaporean creators. USDT payouts for workers.',
  alternates: { canonical: '/sg' },
};

export default function SingaporePage() {
  return (
    <CountryPage
      countryCode="SG"
      countryName="Singapore"
      callout="Built for Singaporean creators."
      language="English + Mandarin + Malay + Tamil"
      highlightCreators="Test against Singaporean audiences in any of four working languages."
      highlightWorkers="Earn USDT — withdraw to any TRC20 wallet."
      topNiches={['Tech & Reviews', 'Finance & Crypto', 'Food & Cooking', 'Travel & Lifestyle', 'Education', 'Beauty & Fashion', 'Gaming']}
    />
  );
}
