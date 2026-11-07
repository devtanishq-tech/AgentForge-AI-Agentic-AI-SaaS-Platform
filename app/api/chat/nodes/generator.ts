import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
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
  const baseSystemText =
    state.route === "rag"
      ? getRagPrompt(state.context ?? "")
      : getSystemPrompt();
  // The generator has no tools bound. If tool-call AIMessages / ToolMessages
  // stay in the history, the model tries to call tools again and Groq rejects it
  // ("Tool choice is none, but model called a tool"). So:
  //  1. tool results of the CURRENT turn are passed as plain text in the system prompt
  //  2. tool-call AIMessages and ToolMessages are removed from the message list
  const lastHumanIndex = state.messages.findLastIndex((m) =>
    HumanMessage.isInstance(m),
  );

  const toolResultsText = state.messages
    .slice(lastHumanIndex + 1)
    .filter((m): m is ToolMessage => ToolMessage.isInstance(m))
    .map((m) => {
      const text =
        typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      return `[${m.name ?? "tool"} result]\n${text}`;
    })
    .join("\n\n");

  const cleanMessages: BaseMessage[] = state.messages.filter((m) => {
    if (ToolMessage.isInstance(m)) return false;
    if (AIMessage.isInstance(m) && m.tool_calls?.length) return false;
    return true;
  });

  const systemText = toolResultsText
    ? `${baseSystemText}\n\nTool results gathered for the user's latest message (already executed, use them to answer; do NOT call any tools):\n${toolResultsText}`
    : baseSystemText;

  // Actual LLM invocation
  const generatorResponse = await model.invoke([
    new SystemMessage(systemText),
    ...cleanMessages,
  ]);
  return {
    messages: [generatorResponse],
  };
};
