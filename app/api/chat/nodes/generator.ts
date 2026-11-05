import { SystemMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph";
import { getMODEL, isModelId } from "../model";
import { messageState } from "../state";
import { getRagPrompt, getSystemPrompt } from "../prompts";
import { RunnableConfig } from "@langchain/core/runnables";

export const generatorNode: GraphNode<typeof messageState> = async (
  state,
  config: RunnableConfig,
) => {
  const selectedModel = config.configurable?.selectedModel as string;

  if (!isModelId(selectedModel)) {
    throw new Error(`Invalid model selected: ${selectedModel}`);
  }
  const model = getMODEL(selectedModel);
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
