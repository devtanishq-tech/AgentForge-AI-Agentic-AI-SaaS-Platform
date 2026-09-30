import type { GraphNode } from "@langchain/langgraph";
import { messageState } from "../state";
import { getTools } from "../toolregistry";
import { ToolNode } from "@langchain/langgraph/prebuilt";

export const mcpToolNode: GraphNode<typeof messageState> = async (
  state,
  config,
) => {
  const tools = await getTools();
  return new ToolNode(tools).invoke(state, config);
};
