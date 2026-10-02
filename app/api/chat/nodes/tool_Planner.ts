import { SystemMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph";
import { getMODEL } from "../model";
import { ToolPlannerPrompt } from "../prompts";
import { messageState } from "../state";
import { getTools } from "../toolregistry";
import { getRecentTurns } from "../messageWindow";

export const toolPlannerNode: GraphNode<typeof messageState> = async (
  state,
) => {
  const tools = await getTools();
  const model = getMODEL("openai/gpt-oss-20b").bindTools(tools);
  const recentMessage = getRecentTurns(state.messages, 3);
  const llmresponse = await model.invoke([
    new SystemMessage(ToolPlannerPrompt),
    ...recentMessage,
  ]);
  return {
    messages: [llmresponse],
  };
};
