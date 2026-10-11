// this file where both dense seacrh and sparse search happen -

import { denseEmbedder, sparsedEmbedder } from "./embeeding";
import { pineconeINdex, userNamespace, pineconeSparseIndex } from "./pineconeD";

export type Chunk = {
  id: string;
  text: string;
  source: string;
  score: number;
};

export type SearchInput = {
  query: string;
  userId: string;
  topK?: number;
  candidates?: number;
};
export async function hybridSearchFunction({
  query,
  userId,
  topK = 8,
  candidates = 20,
}: SearchInput): Promise<Chunk[]> {
  // telling that it will return an array of chunk
  const [[denseVector], [sparseVector]] = await Promise.all([
    denseEmbedder([query]),
    sparsedEmbedder([query], "query"),
  ]);
  const namespace = userNamespace(userId);
  const [dense, sparse] = await Promise.all([
    pineconeINdex.namespace(namespace).query({
      topK: candidates,
      vector: denseVector,
      includeMetadata: true,
    }),
    pineconeSparseIndex.namespace(namespace).query({
      topK: candidates,
      sparseVector: sparseVector,
      includeMetadata: true,
    } as any),
  ]);
  const K = 60;
  const fused = new Map<string, { score: number; meta: any }>();
  for (let matches of [dense.matches, sparse.matches]) {
    (matches ?? []).forEach((match: any, rank: number) => {
      const prev = fused.get(match.id);
      fused.set(match.id, {
        score: (prev?.score ?? 0) + 1 / (K + rank + 1),
        meta: prev?.meta ?? match.metadata,
      });
    });
  }
  //  here this entries function is used to list the number of list stored inside map function
  return [...fused.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, topK)
    .map(([id, { score, meta }]) => ({
      id,
      text: String(meta?.text ?? ""),
      source: String(meta?.source ?? "unknown"),
      score,
    }));
}
