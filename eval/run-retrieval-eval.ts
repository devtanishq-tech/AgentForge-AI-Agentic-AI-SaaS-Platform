import fs from "node:fs";
import path from "node:path";

import { hybridSearchFunction } from "../lib/rag/retrieve";
import { ReRankerFunction } from "../lib/rag/reranker";
import {
  recallAtK,
  mrrAtK,
  ndcgAtK,
  type EvalQuestion,
  type Relevant,
} from "./metrics";

// userNamespace(userId) -> "user_<userId>", so this is the part after "user_"
const USER_ID = process.env.EVAL_USER_ID ?? "P6tBj3LslPWelvFZ2blbghKU1H1y7vZS";

const questions: EvalQuestion[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "eval", "questions.json"), "utf8"),
);

// Silence the reranker's per-call console logs while evaluating
async function quiet<T>(fn: () => Promise<T>): Promise<T> {
  const original = console.log;
  console.log = () => {};
  try {
    return await fn();
  } finally {
    console.log = original;
  }
}

function score(ids: string[], relevant: Relevant) {
  return {
    recall5: recallAtK(ids, relevant, 5),
    mrr10: mrrAtK(ids, relevant, 10),
    ndcg10: ndcgAtK(ids, relevant, 10),
    ids,
  };
}

const avg = (nums: number[]) =>
  nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
const f = (n: number) => n.toFixed(2);

async function main() {
  const rows: {
    id: string;
    query: string;
    before: ReturnType<typeof score>;
    after: ReturnType<typeof score>;
  }[] = [];

  for (const q of questions) {
    // Stage 1: hybrid search (dense + sparse + RRF)
    const hybridChunks = await hybridSearchFunction({
      query: q.query,
      userId: USER_ID,
    });
    if (hybridChunks.length === 0) {
      throw new Error(
        `No chunks returned for "${q.query}". Check EVAL_USER_ID (namespace is user_<userId>) and that the PDF is ingested.`,
      );
    }
    const before = score(
      hybridChunks.map((c) => c.id),
      q.relevant,
    );

    // Stage 2: reranker on the exact same chunks
    const reranked = await quiet(() =>
      ReRankerFunction(q.query, hybridChunks, 10),
    );
    const after = score(
      reranked.map((c) => c.id),
      q.relevant,
    );

    rows.push({ id: q.id, query: q.query, before, after });
    console.log(
      `${q.id}  before R@5=${f(before.recall5)} MRR=${f(before.mrr10)} nDCG=${f(before.ndcg10)}` +
        `  |  after R@5=${f(after.recall5)} MRR=${f(after.mrr10)} nDCG=${f(after.ndcg10)}`,
    );
  }

  const metric = (
    key: "recall5" | "mrr10" | "ndcg10",
    stage: "before" | "after",
  ) => avg(rows.map((r) => r[stage][key]));

  const table = [
    ["Recall@5", metric("recall5", "before"), metric("recall5", "after")],
    ["MRR@10", metric("mrr10", "before"), metric("mrr10", "after")],
    ["nDCG@10", metric("ndcg10", "before"), metric("ndcg10", "after")],
  ] as const;

  console.log(`\nAverages over ${rows.length} questions\n`);
  console.log("| Metric   | Before reranking | After reranking |");
  console.log("|----------|------------------|-----------------|");
  for (const [name, b, a] of table) {
    console.log(
      `| ${name.padEnd(8)} | ${f(b).padEnd(16)} | ${f(a).padEnd(15)} |`,
    );
  }

  const noHit = rows.filter((r) => r.after.recall5 === 0).map((r) => r.id);
  if (noHit.length)
    console.log("\nNo relevant chunk in top 5 after rerank:", noHit.join(", "));

  fs.mkdirSync(path.join(process.cwd(), "eval", "results"), {
    recursive: true,
  });
  const outFile = path.join(
    process.cwd(),
    "eval",
    "results",
    `retrieval-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  fs.writeFileSync(outFile, JSON.stringify({ rows }, null, 2));
  console.log("\nSaved per-question report to", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
