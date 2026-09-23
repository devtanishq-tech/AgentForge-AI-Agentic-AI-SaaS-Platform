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

const llmNode: GraphNode<typeof messageState> = async (state) => {
  const model = getMODEL("openai/gpt-oss-120b");
  const llmresponse = await model.invoke(state.message);
  return {
    message: [llmresponse],
  };
};
//================this done the fetching of data from database and sending back to llm =====
const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
//======================================================================================//
// await checkpointer.setup();
//=====================================================================================//
const graph = new StateGraph(messageState)
  .addNode("llmNode", llmNode)
  .addEdge("__start__", "llmNode")
  .addEdge("llmNode", "__end__");
export const finalGraph = graph.compile({ checkpointer });
