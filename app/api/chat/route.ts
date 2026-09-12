import { threadId } from "worker_threads";
import { finalGraph } from "./graph";

export async function POST(request: Request) {
  /// write the main logic

  const result = await finalGraph.invoke(
    {
      message: {
        role: "human",
        content: "tell me current model knowledge cutoff ? ",
      },
    },
    {
      configurable: { thread_id: "1-1-1--1" },
    },
  );
  console.log("Ai message", result.message[result.message.length - 1].content);

  return Response.json("okay");
}
