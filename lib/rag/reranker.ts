import { pinecone } from "./pineconeD";
import type { Chunk } from "./retrieve";

const RERANKER_MODEL = "bge-reranker-v2-m3";

export async function ReRankerFunction(
  query: string,
  chunks: Chunk[],
  topN = 6,
): Promise<Chunk[]> {
  if (chunks.length === 0) return [];

  const response = await pinecone.inference.rerank({
    model: RERANKER_MODEL,
    query,
    documents: chunks.map((chunk) => ({
      text: chunk.text,
    })),
    rankFields: ["text"],
    topN: Math.min(topN, chunks.length),
    returnDocuments: false,
  });

  const rankedChunks: Chunk[] = response.data.map((item) => {
    const originalChunk = chunks[item.index];

    if (!originalChunk) {
      throw new Error(`Invalid reranker document index: ${item.index}`);
    }

    return {
      ...originalChunk,
      score: item.score,
    };
  });
  return rankedChunks;
}
