// relevant: { chunkId: grade }  (2 = main answer chunk, 1 = partial / duplicate copy)
export type Relevant = Record<string, number>;

export type EvalQuestion = {
  id: string;
  query: string;
  relevant: Relevant;
};

// Of all chunks in your answer key, how many appear in the top k?
export function recallAtK(
  rankedIds: string[],
  relevant: Relevant,
  k: number,
): number {
  const keys = Object.keys(relevant);
  if (keys.length === 0) return 0;
  const top = new Set(rankedIds.slice(0, k));
  return keys.filter((id) => top.has(id)).length / keys.length;
}

// 1 / rank of the first relevant chunk within the top k (0 if none)
export function mrrAtK(
  rankedIds: string[],
  relevant: Relevant,
  k: number,
): number {
  const idx = rankedIds.slice(0, k).findIndex((id) => (relevant[id] ?? 0) > 0);
  return idx === -1 ? 0 : 1 / (idx + 1);
}

// Ranking quality: rewards grade-2 chunks placed near the top
export function ndcgAtK(
  rankedIds: string[],
  relevant: Relevant,
  k: number,
): number {
  const dcg = (grades: number[]) =>
    grades
      .slice(0, k)
      .reduce((sum, g, i) => sum + (2 ** g - 1) / Math.log2(i + 2), 0);

  const actual = rankedIds.slice(0, k).map((id) => relevant[id] ?? 0);
  const ideal = Object.values(relevant).sort((a, b) => b - a);
  const idcg = dcg(ideal);
  return idcg === 0 ? 0 : dcg(actual) / idcg;
}
