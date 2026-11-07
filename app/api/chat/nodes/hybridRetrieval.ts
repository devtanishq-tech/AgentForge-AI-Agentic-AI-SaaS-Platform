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
  const finalChunks = [...pool.values()];
  return { chunks: [...pool.values()] };
};
