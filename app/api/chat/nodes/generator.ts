import { SystemMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph";
import { getMODEL } from "../model";
import { messageState } from "../state";
import { getRagPrompt, getSystemPrompt } from "../prompts";

export const generatorNode: GraphNode<typeof messageState> = async (state) => {
  const model = getMODEL("openai/gpt-oss-120b");
  const systemText =
    state.route === "rag"
      ? getRagPrompt(state.context ?? "")
      : getSystemPrompt();
  const generatorResponse = await model.invoke([
    new SystemMessage(systemText),
    ...state.messages,
  ]);
  return {
    messages: [generatorResponse],
  };
};
