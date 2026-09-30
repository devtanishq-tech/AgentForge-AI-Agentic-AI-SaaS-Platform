import { finalGraph } from "./graph";
import { thread } from "@/db/schema/chat-schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createUIMessageStreamResponse } from "ai";
import { toUIMessageStream } from "@ai-sdk/langchain";
import { HumanMessage } from "@langchain/core/messages";
//()start function means , that we are start processing the event
// controller.enqueue(event);
// controller is used to control  the new output stream
// controller.enqueue(event);, here we are saying
//send this event as a output stream event , final response event stream

//=----------------------=this Set function is called collectionn------------------------------
const hiddenNOde = new Set([
  "routerNode",
  "queryRewritterNode",
  "evaulationNode",
]);
//====================we are making this collection , basically we checking things based on these =============
function hideNODE<T extends { event: string; metadata: Record<string, any> }>(
  source: AsyncIterable<T>,
) {
  return new ReadableStream<T>({
    async start(controller) {
      try {
        for await (let loopevent of source) {
          const node = loopevent.metadata?.langgraph_node;
          if (
            loopevent.event.startsWith("on_chat_model") &&
            node &&
            hiddenNOde.has(node)
          ) {
            continue;
          }
          controller.enqueue(loopevent);
        }
        controller.close();
      } catch (err) {
        console.error(err);
        controller.error(err);
      }
    },
  });
}
export async function POST(request: Request) {
  let { threadID, messaegTextBodyContent } = await request.json();
  const threadsFromsDB = await db
    .select()
    .from(thread)
    .where(eq(thread.id, threadID))
    .limit(1);
  //=====================================================================//
  let threadDataArray = threadsFromsDB[0];
  //===================Extracting user id //=== ===========================//
  const getSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!getSession?.user.id) {
    return new Response("Forbidden you dont have access to  this thread ");
  }
  // again check if user id of thread , does not match the actual user id then

  const userid = getSession?.user.id;
  // means thread does not exist , it means is a new message then we are creating the new thread here
  if (!threadDataArray) {
    const title = messaegTextBodyContent.trim().slice(0, 25);
    await db
      .insert(thread)
      .values({ id: threadID, title: title, userid: userid });
  } else if (getSession.user.id !== threadDataArray.userid) {
    return new Response("Forbidden: you don't have access to this thread", {
      status: 403,
    });
  }
  const streamm = await finalGraph.streamEvents(
    {
      messages: [new HumanMessage(messaegTextBodyContent)],
    },
    {
      version: "v2",
      configurable: { thread_id: threadID, checkpoint_ns: "" },
    },
  );
  return createUIMessageStreamResponse({
    stream: toUIMessageStream(hideNODE(streamm)),
  });
}
