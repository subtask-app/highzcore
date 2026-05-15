import { CountryPage } from '@/components/marketing/CountryPage';

export const metadata = {
  title: 'Highzcore for Malaysian YouTube creators',
  description: 'Audience feedback, thumbnail testing, and real promotion for Malaysian creators. USDT payouts for workers.',
  alternates: { canonical: '/my' },
};

export default function MalaysiaPage() {
  return (
    <CountryPage
      countryCode="MY"
      countryName="Malaysia"
      callout="Built for Malaysian creators."
      language="Bahasa Melayu + English + Mandarin"
      highlightCreators="Test in Bahasa Melayu, Mandarin, or English. Match your audience."
      highlightWorkers="Earn USDT — withdraw to any TRC20 wallet."
      topNiches={['Tech & Reviews', 'Gaming', 'Food & Cooking', 'Beauty & Fashion', 'Comedy & Sketch', 'Education', 'Music', 'Lifestyle']}
    />
  );
}
