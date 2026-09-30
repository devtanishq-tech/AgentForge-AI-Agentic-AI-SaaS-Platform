import { StateGraph, type GraphNode } from "@langchain/langgraph";
import { messageState } from "./state";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
// import { model } from "./model";
import { getMODEL } from "./model";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { producttool, weatherTool, webSearchTool } from "./tool";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { routerNode } from "./nodes/router";
import { getSystemPrompt } from "./prompts";
import { toolPlannerNode } from "./nodes/tool_Planner";
import { generatorNode } from "./nodes/generator";
import { mcpToolNode } from "./nodes/mcpToolNode";

//=======================================/
//=============================================================//
// const llmNode: GraphNode<typeof messageState> = async (state) => {
//   const model = getMODEL("openai/gpt-oss-120b").bindTools(tools);
//   const llmresponse = await model.invoke([
//     new SystemMessage(getSystemPrompt()),
//     ...state.messages,
//   ]);
//   return {
//     messages: [llmresponse],
//   };
// };

const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
// await checkpointer.setup();
function shouldContinue(state: typeof messageState.State) {
  const lastmessage = state.messages.at(-1);
  if (
    lastmessage &&
    AIMessage.isInstance(lastmessage) &&
    lastmessage.tool_calls?.length
  ) {
    return "mcpToolnode";
  }
  return "__end__";
}
//========================temporary Change in the conditions //=========================
function shouldContinue2(state: typeof messageState.State) {
  if (state.route === "tool") {
    return "toolPlannerNode";
  }
  return "generatorNode";
}
//=================================================================================//
const graph = new StateGraph(messageState)
  //----------------------------------------
  .addNode("routerNode", routerNode)
  .addNode("toolPlannerNode", toolPlannerNode)
  .addNode("mcpToolnode", mcpToolNode)
  .addNode("generatorNode", generatorNode)

  //========================================x==============//
  .addEdge("__start__", "routerNode")
  .addEdge("mcpToolnode", "generatorNode")
  .addEdge("generatorNode", "__end__")
  .addConditionalEdges("routerNode", shouldContinue2, {
    toolPlannerNode: "toolPlannerNode",
    generatorNode: "generatorNode",
  })
  .addConditionalEdges("toolPlannerNode", shouldContinue);

export const finalGraph = graph.compile({ checkpointer });
