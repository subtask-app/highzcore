import { CountryPage } from '@/components/marketing/CountryPage';

export const metadata = {
  title: 'Highzcore for Nigerian YouTube creators',
  description: 'Audience feedback, thumbnail testing, and real promotion for Nigerian creators. USDT payouts for workers.',
  alternates: { canonical: '/ng' },
};

export default function NigeriaPage() {
  return (
    <CountryPage
      countryCode="NG"
      countryName="Nigeria"
      callout="Built for Nigerian creators."
      language="English + Yoruba / Igbo / Hausa"
      highlightCreators="Real Nigerian audiences testing your videos."
      highlightWorkers="Earn USDT — withdraw to any TRC20 wallet."
      topNiches={['Nollywood', 'Gospel', 'Tech & Reviews', 'Comedy & Sketch', 'Finance & Crypto', 'Music', 'Self-Improvement', 'Education']}
    />
  );
}
