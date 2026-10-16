// actual hybrid retrival happen -

import { HumanMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph";
import { messageState } from "../state";
import { hybridSearchFunction, type Chunk } from "@/lib/rag/retrieve";

export const hYbridretrivalNode: GraphNode<typeof messageState> = async (
  state,
  config,
) => {
  const userId = config?.configurable?.userId as string | undefined;
  if (!userId) {
    throw new Error("User id not existed in the config , unauthorized access ");
  }
  const lastMessage = [...state.messages]
    .reverse()
    .find((m) => HumanMessage.isInstance(m));
  const original =
    typeof lastMessage?.content === "string" ? lastMessage.content : "";
  const queries = state.queries?.length ? state.queries : [original];

  const results = await Promise.all(
    queries.map((query) => hybridSearchFunction({ query, userId, topK: 15 })),
  );

  // pool all candidates, no duplicates
  const pool = new Map<string, Chunk>();
  for (const list of results) {
    for (const c of list) if (!pool.has(c.id)) pool.set(c.id, c);
  }
  console.log();
  console.log(
    `Hybrid retrieval: ${pool.size} unique chunks for ${queries.length} queries`,
  );
  //===================================================================================
  //===================================================================================
  //===================================================================================
  const finalChunks = [...pool.values()];

  console.log("\n" + "=".repeat(100));
  console.log(`HYBRID RETRIEVAL: ${finalChunks.length} UNIQUE CHUNKS`);
  console.log("Queries:", queries);
  console.log("=".repeat(100));

  finalChunks.forEach((chunk, index) => {
    console.log(`\n[CHUNK ${index + 1}]`);
    console.log("ID:", chunk.id);
    console.log("Source:", chunk.source);
    console.log("Hybrid Score (RRF):", chunk.score);
    console.log("Text:\n", chunk.text);
    console.log("-".repeat(100));
  });

  console.log("\n" + "=".repeat(100));
  console.log("END OF HYBRID RETRIEVAL");
  console.log("=".repeat(100));
  return { chunks: [...pool.values()] };
};
