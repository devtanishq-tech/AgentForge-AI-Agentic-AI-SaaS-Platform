import { GraphNode } from "@langchain/langgraph";
import { messageState } from "../state";
import { stat } from "fs";
import { HumanMessage } from "@langchain/core/messages";
import { ReRankerFunction } from "@/lib/rag/reranker";

export const reRankerNode: GraphNode<typeof messageState> = async (state) => {
  const chunks = state.chunks ?? [];
  const lastMessage = [...state.messages]
    .reverse()
    .find((current) => HumanMessage.isInstance(current));
  const query =
    typeof lastMessage?.content === "string" ? lastMessage.content : "";
  const result = await ReRankerFunction(query, chunks, 4);
  const context = result
    .map((c, i) => `[${i + 1}] (${c.source})\n${c.text}`)
    .join("\n\n");
  console.log(`-`.repeat(100));
  console.log(`NOw there will be only 4 result come from ReRanker NOde -`);
  console.log(`Context:`, context);
  console.log(`-`.repeat(100));
  return {
    context,
  };
};
