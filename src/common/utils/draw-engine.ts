/**
 * Draw Engine
 * Supports RANDOM (lottery-style) and ALGORITHMIC (frequency-weighted) draws
 */

export function generateRandomNumbers(): number[] {
  const numbers = new Set<number>();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1); // 1–45
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

export function generateAlgorithmicNumbers(
  allUserScores: number[]
): number[] {
  // Build frequency map
  const freq: Record<number, number> = {};
  for (const score of allUserScores) {
    freq[score] = (freq[score] || 0) + 1;
  }

  // Weight: less frequent scores have higher weight
  const maxFreq = Math.max(...Object.values(freq), 1);
  const weighted: { score: number; weight: number }[] = [];

  for (let i = 1; i <= 45; i++) {
    const w = maxFreq - (freq[i] || 0) + 1;
    weighted.push({ score: i, weight: w });
  }

  // Weighted random selection
  const selected = new Set<number>();
  while (selected.size < 5) {
    const totalWeight = weighted
      .filter((w) => !selected.has(w.score))
      .reduce((sum, w) => sum + w.weight, 0);

    let rand = Math.random() * totalWeight;
    for (const item of weighted) {
      if (selected.has(item.score)) continue;
      rand -= item.weight;
      if (rand <= 0) {
        selected.add(item.score);
        break;
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

export function countMatches(
  userScores: number[],
  winningNumbers: number[]
): number {
  const winSet = new Set(winningNumbers);
  return userScores.filter((s) => winSet.has(s)).length;
}

export function getMatchTier(
  matchCount: number
): "FIVE_MATCH" | "FOUR_MATCH" | "THREE_MATCH" | null {
  if (matchCount >= 5) return "FIVE_MATCH";
  if (matchCount === 4) return "FOUR_MATCH";
  if (matchCount === 3) return "THREE_MATCH";
  return null;
}