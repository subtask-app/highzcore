// ABTest pricing tiers. Same shape as Insights but at the lower end —
// votes are quick (10-30 seconds each) so totals are smaller.

export interface AbtestTier {
  id: 'quick' | 'standard' | 'deep';
  label: string;
  voteCount: number;
  totalUsd: number;
  highlight?: string;
}

export const ABTEST_TIERS: AbtestTier[] = [
  { id: 'quick',    label: 'Quick',    voteCount: 30,   totalUsd: 15  },
  { id: 'standard', label: 'Standard', voteCount: 100,  totalUsd: 40, highlight: 'Most popular' },
  { id: 'deep',     label: 'Deep',     voteCount: 300,  totalUsd: 100 },
];

export const PLATFORM_FEE_RATIO = 0.30;

export function feeBreakdown(totalUsd: number, voteCount: number) {
  const platformFee = totalUsd * PLATFORM_FEE_RATIO;
  const workerPool = totalUsd - platformFee;
  const perTask = voteCount > 0 ? workerPool / voteCount : 0;
  return { totalUsd, platformFee, workerPool, perTask };
}

export function tierById(id: string): AbtestTier | undefined {
  return ABTEST_TIERS.find((t) => t.id === id);
}
