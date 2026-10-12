import { AudioWaveform } from "lucide-react";
import type { Chunk } from "./retrieve";
import {
  AutoTokenizer,
  AutoModelForSequenceClassification,
} from "@xenova/transformers";
import { Arya } from "next/font/google";
import { array } from "better-auth";
let MODEL = "Xenova/ms-marco-MiniLM-L-6-v2";
let loaderReRANKER: Promise<{ tokenizer: any; model: any }> | null = null;
function load() {
  loaderReRANKER ??= Promise.all([
    AutoTokenizer.from_pretrained(MODEL),
    AutoModelForSequenceClassification.from_pretrained(MODEL),
  ]).then(([tokenizer, model]) => ({ tokenizer, model }));
  return loaderReRANKER;
}
// this function do the intializing token
export async function ReRankerFunction(
  query: string,
  chunks: Chunk[],
  topN = 4, // here default value is 4
): Promise<Chunk[]> {
  if (chunks.length === 0) {
    return [];
  }
  const { tokenizer, model } = await load();
  const input = tokenizer(new Array(chunks.length).fill(query), {
    text_pair: chunks.map((c) => c.text),
    padding: true,
    truncation: true,
  });
  const { logits } = await model(input);
  const perItem = logits.dims?.[1] ?? 1;
  const data = Array.from(logits.data as Float32Array);
  return chunks
    .map((c, i) => ({
      ...c,
      score: data[i * perItem + (perItem - 1)],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
