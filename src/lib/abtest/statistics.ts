// A/B test statistics — Wilson score interval for proportions.
//
// We use the lower bound of each variant's Wilson 95% CI to rank variants
// when calling a winner. This is robust at low sample sizes (better than
// naive p-hat ranking, which says a 1/1 split is "100%").
//
// Reference:
//   https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval

const Z_95 = 1.96; // two-tailed 95% confidence

export interface VariantResult {
  id: string;
  votes: number;
  share: number;          // raw share of total votes (0..1)
  lowerBound: number;     // Wilson 95% CI lower bound
  upperBound: number;     // Wilson 95% CI upper bound
}

export interface AbtestSummary {
  totalVotes: number;
  results: VariantResult[];
  /** Variant id with the highest Wilson lower bound, or null if no votes. */
  winnerId: string | null;
  /** True when the winner's lower bound exceeds every other variant's upper bound. */
  significant: boolean;
}

function wilsonInterval(successes: number, total: number): { low: number; high: number; phat: number } {
  if (total === 0) return { low: 0, high: 0, phat: 0 };
  const z = Z_95;
  const phat = successes / total;
  const denom = 1 + (z * z) / total;
  const center = phat + (z * z) / (2 * total);
  const margin = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);
  return {
    low: Math.max(0, (center - margin) / denom),
    high: Math.min(1, (center + margin) / denom),
    phat,
  };
}

export function summarize(votesById: Record<string, number>): AbtestSummary {
  const entries = Object.entries(votesById);
  const totalVotes = entries.reduce((s, [, n]) => s + n, 0);

  const results: VariantResult[] = entries.map(([id, votes]) => {
    const { low, high } = wilsonInterval(votes, totalVotes);
    return {
      id,
      votes,
      share: totalVotes > 0 ? votes / totalVotes : 0,
      lowerBound: low,
      upperBound: high,
    };
  });

  if (totalVotes === 0) {
    return { totalVotes: 0, results, winnerId: null, significant: false };
  }

  // Winner = highest Wilson lower bound. Significant when its lower bound
  // > every other variant's upper bound.
  const sorted = [...results].sort((a, b) => b.lowerBound - a.lowerBound);
  const winner = sorted[0];
  const significant = sorted
    .slice(1)
    .every((r) => winner.lowerBound > r.upperBound);

  return {
    totalVotes,
    results,
    winnerId: winner.id,
    significant,
  };
}
