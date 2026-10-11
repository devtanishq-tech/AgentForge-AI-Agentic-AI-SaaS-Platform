// actual hybrid retrival happen -

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph";
import { messageState } from "../state";
import { hybridSearchFunction } from "@/lib/rag/retrieve";

export const hYbridretrivalNode: GraphNode<typeof messageState> = async (
  state,
  config,
) => {
  const userId = config?.configurable?.userId as string | undefined;
  if (!userId) {
    throw new Error("User id not existed in the config , unauthorized access ");
  }
  // now we need lastMessage from
  const lastMessage = [...state.messages]
    .reverse()
    .find((m) => HumanMessage.isInstance(m));
  // only want the human message from the states

  const query =
    typeof lastMessage?.content === "string" ? lastMessage.content : "";
  console.log(`-`.repeat(100));
  console.log(`Query:`, query);
  console.log(`-`.repeat(100));
  const result = await hybridSearchFunction({ query, userId, topK: 8 });
  console.log(`Hybrid retrieval: ${result.length} chunks for "${query}"`);
  const context = result
    .map((c, i) => `[${i + 1}] (${c.source})\n${c.text}`)
    .join("\n\n");
  console.log(`Context:`, context);
  return { context };
};
