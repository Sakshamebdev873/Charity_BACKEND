
export function generateRandomNumbers(): number[] {
  const numbers = new Set<number>();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

export function generateAlgorithmicNumbers(allUserScores: number[]): number[] {
  // If no scores exist, fall back to random
  if (!allUserScores || allUserScores.length === 0) {
    return generateRandomNumbers();
  }

  // Build frequency map of all user scores
  const freq: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) {
    freq[i] = 0; // initialize all numbers
  }
  for (const score of allUserScores) {
    if (score >= 1 && score <= 45) {
      freq[score] = (freq[score] || 0) + 1;
    }
  }

  // Weight: less frequent scores = higher weight (harder to win)
  const maxFreq = Math.max(...Object.values(freq), 1);

  const pool: { score: number; weight: number }[] = [];
  for (let i = 1; i <= 45; i++) {
    // Inverse frequency weighting: rare scores get more weight
    const weight = maxFreq - freq[i] + 1;
    pool.push({ score: i, weight });
  }

  // Weighted random selection without replacement
  const selected = new Set<number>();
  const remaining = [...pool];

  while (selected.size < 5 && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight <= 0) {
      // Fallback: pick randomly from remaining
      const idx = Math.floor(Math.random() * remaining.length);
      selected.add(remaining[idx].score);
      remaining.splice(idx, 1);
      continue;
    }

    let rand = Math.random() * totalWeight;
    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].weight;
      if (rand <= 0) {
        selected.add(remaining[i].score);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

export function countMatches(userScores: number[], winningNumbers: number[]): number {
  const winSet = new Set(winningNumbers);
  return userScores.filter((s) => winSet.has(s)).length;
}
// Add this TEMPORARY function for testing
export function generateRiggedNumbers(): number[] {
  // Test user's scores — guarantees 5-match jackpot
  return [42,38,36,31,29];
}
export function getMatchTier(matchCount: number): "FIVE_MATCH" | "FOUR_MATCH" | "THREE_MATCH" | null {
  if (matchCount >= 5) return "FIVE_MATCH";
  if (matchCount === 4) return "FOUR_MATCH";
  if (matchCount === 3) return "THREE_MATCH";
  return null;
}