// Collab pricing — each side puts up an escrow. Platform takes 15% of each
// side (so 30% of the combined pot), payable when both sides confirm
// completion. Refund logic for declined / disputed collabs is handled in
// the admin tools milestone.

export interface CollabEscrowPreset {
  id: 'micro' | 'small' | 'standard' | 'premium';
  label: string;
  amountUsd: number;
  highlight?: string;
}

export const ESCROW_PRESETS: CollabEscrowPreset[] = [
  { id: 'micro',    label: 'Micro',    amountUsd: 20  },
  { id: 'small',    label: 'Small',    amountUsd: 50, highlight: 'Most common' },
  { id: 'standard', label: 'Standard', amountUsd: 100 },
  { id: 'premium',  label: 'Premium',  amountUsd: 250 },
];

export const COLLAB_FEE_PER_SIDE_RATIO = 0.15;
export const MIN_ESCROW_USD = 5;
export const MAX_ESCROW_USD = 5000;

export function collabFeeBreakdown(escrowPerSide: number) {
  const totalPot = escrowPerSide * 2;
  const platformFee = totalPot * COLLAB_FEE_PER_SIDE_RATIO * 2; // 15% per side
  const netReturnedPerSide = escrowPerSide * (1 - COLLAB_FEE_PER_SIDE_RATIO);
  return {
    escrowPerSide,
    totalPot,
    platformFee,
    netReturnedPerSide,
    feePerSide: escrowPerSide * COLLAB_FEE_PER_SIDE_RATIO,
  };
}

export const COLLAB_KIND_LABEL = {
  shoutout:        'Shoutout',
  joint_video:     'Joint video',
  live_stream:     'Joint live stream',
  channel_feature: 'Channel feature',
} as const;

export const COLLAB_KIND_DESCRIPTION = {
  shoutout:        'A brief mention or recommendation in one of their videos / community posts.',
  joint_video:     'You both appear in a single video together — either side-by-side or as guests.',
  live_stream:     'A live stream you host together on either or both channels.',
  channel_feature: 'A dedicated feature of your channel in one of theirs (longer form than a shoutout).',
} as const;
