/**
 * Prize Pool Calculator
 * Pool shares: 5-match 40%, 4-match 35%, 3-match 25%
 */

export const POOL_SHARES = {
  FIVE_MATCH: 0.4,
  FOUR_MATCH: 0.35,
  THREE_MATCH: 0.25,
} as const;

export function calculatePoolTiers(totalPoolCents: number) {
  return {
    fiveMatchPool: Math.floor(totalPoolCents * POOL_SHARES.FIVE_MATCH),
    fourMatchPool: Math.floor(totalPoolCents * POOL_SHARES.FOUR_MATCH),
    threeMatchPool: Math.floor(totalPoolCents * POOL_SHARES.THREE_MATCH),
  };
}

export function calculatePrizePerWinner(
  poolForTier: number,
  winnerCount: number
): number {
  if (winnerCount === 0) return 0;
  return Math.floor(poolForTier / winnerCount);
}

export function calculatePaymentSplit(
  amountCents: number,
  charityPercent: number,
  prizePoolPercent: number = 50
) {
  const charityShare = Math.floor(amountCents * (charityPercent / 100));
  const remaining = amountCents - charityShare;
  const prizePoolShare = Math.floor(remaining * (prizePoolPercent / 100));
  const platformShare = remaining - prizePoolShare;

  return { charityShare, prizePoolShare, platformShare };
}