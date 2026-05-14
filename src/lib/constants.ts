// Money / payout knobs. ALL pricing logic in the app should read from this file.

export const PRICE_PER_SUBSCRIBER = 150;          // ₦ per subscriber the client pays
export const WORKER_PAYOUT_PER_TASK = 120;        // ₦ per verified task the worker earns
export const PLATFORM_FEE_RATIO = 0.20;           // 20% — the rest goes to the worker pool
export const MIN_WITHDRAWAL_AMOUNT = 1000;        // ₦ minimum withdrawal
export const REFERRAL_BONUS = 50;                 // ₦ paid to referrer when their referee verifies their first task

export interface PricingPackage {
  name: string;
  subscribers: number;
  price: number;
  popular?: boolean;
}

export const PRICING_PACKAGES: PricingPackage[] = [
  { name: 'Starter',  subscribers: 100,  price: 15_000 },
  { name: 'Growth',   subscribers: 500,  price: 75_000 },
  { name: 'Standard', subscribers: 1000, price: 150_000, popular: true },
  { name: 'Premium',  subscribers: 2000, price: 280_000 },
];
