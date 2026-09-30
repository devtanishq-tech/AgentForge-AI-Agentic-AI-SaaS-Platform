import { SystemMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph";
import { getMODEL } from "../model";
import { getSystemPrompt, ToolPlannerPrompt } from "../prompts";
import { messageState } from "../state";
import { getTools } from "../toolregistry";

export const toolPlannerNode: GraphNode<typeof messageState> = async (
  state,
) => {
  const tools = await getTools();
  const model = getMODEL("openai/gpt-oss-120b").bindTools(tools);
  const llmresponse = await model.invoke([
    new SystemMessage(ToolPlannerPrompt),
    ...state.messages,
  ]);
  return {
    messages: [llmresponse],
  };
};
