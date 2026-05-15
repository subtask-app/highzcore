// Insights pricing tiers. Total amount paid by the creator; we keep 30%,
// the remaining 70% is split evenly into per-task payouts.

export interface InsightsTier {
  id: 'starter' | 'growth' | 'pro';
  label: string;
  responseCount: number;
  totalUsd: number;
  highlight?: string;
}

export const INSIGHTS_TIERS: InsightsTier[] = [
  { id: 'starter', label: 'Starter', responseCount: 50,   totalUsd: 50  },
  { id: 'growth',  label: 'Growth',  responseCount: 200,  totalUsd: 150, highlight: 'Most popular' },
  { id: 'pro',     label: 'Pro',     responseCount: 1000, totalUsd: 400 },
];

export const PLATFORM_FEE_RATIO = 0.30;

export function feeBreakdown(totalUsd: number, responseCount: number) {
  const platformFee = totalUsd * PLATFORM_FEE_RATIO;
  const workerPool = totalUsd - platformFee;
  const perTask = responseCount > 0 ? workerPool / responseCount : 0;
  return {
    totalUsd,
    platformFee,
    workerPool,
    perTask,
  };
}

export function tierById(id: string): InsightsTier | undefined {
  return INSIGHTS_TIERS.find((t) => t.id === id);
}
