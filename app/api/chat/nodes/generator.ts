import { SystemMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph";
import { getMODEL } from "../model";
import { messageState } from "../state";
import { getSystemPrompt } from "../prompts";
import { getRecentTurns } from "../messageWindow";

export const generatorNode: GraphNode<typeof messageState> = async (state) => {
  const model = getMODEL("openai/gpt-oss-120b");
  const recentMessages = getRecentTurns(state.messages, 3);
  const generatorResponse = await model.invoke([
    new SystemMessage(getSystemPrompt()),
    ...state.messages,
  ]);
  return {
    messages: [generatorResponse],
  };
};
