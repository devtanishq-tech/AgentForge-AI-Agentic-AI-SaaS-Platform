import {
  StateGraph,
  StateSchema,
  MessagesValue,
  type GraphNode,
} from "@langchain/langgraph";
import { messageState } from "./state";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
// import { model } from "./model";
import { getMODEL } from "./model";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { producttool } from "./tool";
import { AIMessage } from "@langchain/core/messages";
const tools = [producttool];
const toolNode = new ToolNode(tools);
const llmNode: GraphNode<typeof messageState> = async (state) => {
  const model = getMODEL("openai/gpt-oss-120b").bindTools(tools);
  const llmresponse = await model.invoke(state.messages);
  return {
    messages: [llmresponse],
  };
};

//================this done the fetching of data from database and sending back to llm =====
const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
//======================================================================================//
// await checkpointer.setup();
//=====================================================================================//
function shouldContinue(state: typeof messageState.State) {
  const lastMessage = state.messages.at(-1);
  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return "llmNode";
  }
  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }
  return "__end__";
}
const graph = new StateGraph(messageState)
  .addNode("llmNode", llmNode)
  .addNode("toolNode", toolNode)
  .addEdge("__start__", "llmNode")
  .addConditionalEdges("llmNode", shouldContinue)
  .addEdge("toolNode", "llmNode");
export const finalGraph = graph.compile({ checkpointer });
