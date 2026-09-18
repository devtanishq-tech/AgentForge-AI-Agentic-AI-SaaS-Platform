import {
  StateGraph,
  StateSchema,
  MessagesValue,
  type GraphNode,
} from "@langchain/langgraph";
import { messageState } from "./state";
// import { model } from "./model";
import { getMODEL } from "./model";
import { MemorySaver } from "@langchain/langgraph";

const llmNode: GraphNode<typeof messageState> = async (state) => {
  const model = getMODEL("openai/gpt-oss-120b");
  const llmresponse = await model.invoke(state.message);
  return {
    message: [llmresponse],
  };
};
const checkpointer = new MemorySaver();
const graph = new StateGraph(messageState)
  .addNode("llmNode", llmNode)
  .addEdge("__start__", "llmNode")
  .addEdge("llmNode", "__end__");
export const finalGraph = graph.compile({ checkpointer });
