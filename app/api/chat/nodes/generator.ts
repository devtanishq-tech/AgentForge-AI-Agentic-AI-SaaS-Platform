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
  //=======================things we are fetching from config file //=============
  const selectedModel = config.configurable?.selectedModel as string;
  const userHaveProPlan = config.configurable?.userHaveProPlan === true;

  if (!isModelId(selectedModel)) {
    throw new Error(`Invalid model selected: ${selectedModel}`);
  }
  const { model, actualModelId } = getMODEL(selectedModel, userHaveProPlan);
  console.log("Generator Model:", actualModelId);
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
