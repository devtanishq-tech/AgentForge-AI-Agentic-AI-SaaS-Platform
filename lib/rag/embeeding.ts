import { pipeline } from "@xenova/transformers";
import { pinecone } from "./pineconeD";

export type sparseVectorType = { indices: number[]; value: number[] };

export const embeeder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);
let embeederPromise: Promise<any> | null = null;
function getEmbeeder() {
  embeederPromise ?? pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  return embeederPromise;
}
export async function denseEmbedder(texts: string[]): Promise<number[][]> {
  // text is array of chunks that already get splitted into pieces and stored in an array -
  const embedder = await getEmbeeder();
  const result: number[][] = [];
  for (let i = 0; i < texts.length; i += 32) {
    const output = await embedder(texts.slice(i, i + 32), {
      pooling: "mean",
      normalize: true,
    });
    result.push(...(output.tolist() as number[][]));
  }
  return result;
}
export async function sparsedEmbedder(
  texts: string[],
  inputType: "passage" | "query",
): Promise<sparseVectorType[]> {
  const result: sparseVectorType[] = [];
  for (let i = 0; i < texts.length; i += 96) {
    const output = await pinecone.inference._embed({
      // this is used to sparse embedding using pinecone
      model: "pinecone-sparse-english-v0",
      inputs: texts.slice(i, i + 96),
      parameters: { inputType, truncate: "END" },
    } as any);
    for (let data of output.data as any[]) {
      result.push({ indices: data.sparseIndices, value: data.sparseValues });
      // here sparseIndices and data.sparseValues come from output.data their type is not defined
      // if want to verify need google them use pinecone docs
    }
  }
  return result;
}

// and now this function will going to be used in denseEmbeeder function-
