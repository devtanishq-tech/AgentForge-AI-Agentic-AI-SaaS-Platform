import { threadId } from "worker_threads";
import { finalGraph } from "./graph";
import { thread } from "@/db/schema/chat-schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { Users } from "lucide-react";
import { user } from "@/db/schema/auth-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
export async function POST(request: Request) {
  let { threadID, messaegTextBodyContent } = await request.json();
  const threadsFromsDB = await db
    .select()
    .from(thread)
    .where(eq(thread.id, threadID))
    .limit(1);
  //=====================================================================//
  let threadDataArray = threadsFromsDB[0];
  //===================Extracting user id //==============================//
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
    const title = messaegTextBodyContent.trim().slice(0, 20);
    await db
      .insert(thread)
      .values({ id: threadID, title: title, userid: userid });
  } else if (getSession.user.id !== threadDataArray.userid) {
    return new Response("Forbidden: you don't have access to this thread", {
      status: 403,
    });
  }

  const result = await finalGraph.invoke(
    {
      message: {
        role: "human",
        content: messaegTextBodyContent,
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
