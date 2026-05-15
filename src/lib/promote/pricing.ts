// Promote pricing tiers — share-based. Each "task" is one share delivered
// by a worker to their own audience on a target platform.

export interface PromoteTier {
  id: 'small' | 'standard' | 'wide';
  label: string;
  shareCount: number;
  totalUsd: number;
  highlight?: string;
}

export const PROMOTE_TIERS: PromoteTier[] = [
  { id: 'small',    label: 'Small',    shareCount: 10,   totalUsd: 35  },
  { id: 'standard', label: 'Standard', shareCount: 30,   totalUsd: 100, highlight: 'Most popular' },
  { id: 'wide',     label: 'Wide',     shareCount: 100,  totalUsd: 300 },
];

export const PLATFORM_FEE_RATIO = 0.30;

export function feeBreakdown(totalUsd: number, shareCount: number) {
  const platformFee = totalUsd * PLATFORM_FEE_RATIO;
  const workerPool = totalUsd - platformFee;
  const perTask = shareCount > 0 ? workerPool / shareCount : 0;
  return { totalUsd, platformFee, workerPool, perTask };
}

export function tierById(id: string): PromoteTier | undefined {
  return PROMOTE_TIERS.find((t) => t.id === id);
}
