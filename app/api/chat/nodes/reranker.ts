import { GraphNode } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { messageState } from "../state";
import { ReRankerFunction } from "@/lib/rag/reranker";

export const reRankerNode: GraphNode<typeof messageState> = async (state) => {
  const chunks = state.chunks ?? [];

  const lastMessage = [...state.messages]
    .reverse()
    .find((message) => HumanMessage.isInstance(message));

  const originalQuery =
    typeof lastMessage?.content === "string" ? lastMessage.content : "";

  if (!originalQuery.trim() || chunks.length === 0) {
    return { context: "" };
  }

  // Rank the complete candidate pool against the actual question.
  const ranked = await ReRankerFunction(
    originalQuery,
    chunks,
    Math.min(10, chunks.length),
  );

  // Keep only the most relevant chunks.
  const finalChunks = ranked.slice(0, 8);

  const context = finalChunks
    .map(
      (chunk, index) =>
        `[${index + 1}] (Source: ${chunk.source})\n${chunk.text}`,
    )
    .join("\n\n");

  console.log("Original query:", originalQuery);
  console.log("Candidates:", chunks.length);
  console.log("Final chunks:", finalChunks.length);

  return { context };
};
