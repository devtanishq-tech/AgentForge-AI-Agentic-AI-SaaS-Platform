import { StateGraph } from "@langchain/langgraph";
import { messageState } from "./state";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { AIMessage } from "@langchain/core/messages";
import { routerNode } from "./nodes/router";
import { toolPlannerNode } from "./nodes/tool_Planner";
import { generatorNode } from "./nodes/generator";
import { mcpToolNode } from "./nodes/mcpToolNode";
import { queryRewriterNode } from "./nodes/queryRewriter.ts";
import { hYbridretrivalNode } from "./nodes/hybridRetrieval";
import { reRankerNode } from "./nodes/reranker";

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
  if (state.route === "rag") {
    return "queryRewritterNode";
  }
  return "generatorNode";
}
//=================================================================================//
const graph = new StateGraph(messageState)
  //----------------------------------------
  .addNode("routerNode", routerNode)
  .addNode("toolPlannerNode", toolPlannerNode)
  .addNode("mcpToolnode", mcpToolNode)
  .addNode("queryRewritterNode", queryRewriterNode)
  .addNode("hybridRetrivalNode", hYbridretrivalNode)
  .addNode("reRankerNOde", reRankerNode)
  .addNode("generatorNode", generatorNode)

  //========================================x==============//
  .addEdge("__start__", "routerNode")
  .addEdge("mcpToolnode", "generatorNode")
  .addEdge("queryRewritterNode", "hybridRetrivalNode")
  .addEdge("hybridRetrivalNode", "reRankerNOde")
  .addEdge("reRankerNOde", "generatorNode")
  .addEdge("generatorNode", "__end__")
  .addConditionalEdges("routerNode", shouldContinue2, {
    toolPlannerNode: "toolPlannerNode",
    queryRewritterNode: "queryRewritterNode",
    generatorNode: "generatorNode",
  })
  .addConditionalEdges("toolPlannerNode", shouldContinue);

export const finalGraph = graph.compile({ checkpointer });
