import { threadId } from "worker_threads";
import { finalGraph } from "./graph";

export async function POST(request: Request) {
  const requestMessage = await request.json();
  console.log({ requestMessage });
  const userMessage = requestMessage.messaegTextBodyContent;
  console.log(userMessage);
  // console.log(requestMessage.)'
  const result = await finalGraph.invoke(
    {
      message: {
        role: "human",
        content: userMessage,
      },
    },
    {
      configurable: { thread_id: "1-1-1--1" },
    },
  );
  console.log(`Human -`, result.message[0].content);
  console.log("Ai message-", result.message[result.message.length - 1].content);

  return Response.json("okay");
}
