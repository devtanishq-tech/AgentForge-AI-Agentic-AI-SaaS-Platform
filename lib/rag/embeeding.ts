import { pipeline } from "@xenova/transformers";
import { pinecone } from "./pineconeD";

export type sparseVectorType = { indices: number[]; values: number[] };
const DENSE_MODEL = "llama-text-embed-v2";
export async function denseEmbedder(
  texts: string[],
  inputType: "passage" | "query",
): Promise<number[][]> {
  const result: number[][] = [];
  const BATCH_SIZE = 96;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await pinecone.inference.embed({
      model: DENSE_MODEL,
      inputs: batch,
      parameters: {
        inputType,
        truncate: "END",
      },
    });
    for (const item of response.data) {
      if (item.vectorType !== "dense") {
        throw new Error("Expected a dense embedding");
      }
      result.push(item.values);
    }
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
      result.push({ indices: data.sparseIndices, values: data.sparseValues });
      // here sparseIndices and data.sparseValues come from output.data their type is not defined
      // if want to verify need google them use pinecone docs
    }
  }
  return result;
}

// and now this function will going to be used in denseEmbeeder function-
