import { GraphNode } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { messageState } from "../state";
import { ReRankerFunction } from "@/lib/rag/reranker";
import type { Chunk } from "@/lib/rag/retrieve";

export const reRankerNode: GraphNode<typeof messageState> = async (state) => {
  const chunks = state.chunks ?? [];
  const lastMessage = [...state.messages]
    .reverse()
    .find((current) => HumanMessage.isInstance(current));
  const original =
    typeof lastMessage?.content === "string" ? lastMessage.content : "";
  const queries = state.queries?.length ? state.queries : [original];

  // best 3 chunks for each sub-query, merged without duplicates
  const seen = new Set<string>();
  const merged: Chunk[] = [];
  for (const query of queries) {
    const top = await ReRankerFunction(query, chunks, 10);
    for (const c of top) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        merged.push(c);
      }
    }
  }
  const final = merged.slice(0, 8);
  const context = final
    .map((c, i) => `[${i + 1}] (${c.source})\n${c.text}`)
    .join("\n\n");
  console.log(`-`.repeat(100));
  console.log(
    `Reranker kept ${final.length} chunks for ${queries.length} queries`,
  );
  console.log(`Context:`, context);
  console.log(`-`.repeat(100));
  return { context };
};
