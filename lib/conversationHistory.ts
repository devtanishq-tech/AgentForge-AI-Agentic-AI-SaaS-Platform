import { db } from "@/db";
import { thread } from "@/db/schema/chat-schema";
import {
  BaseMessage,
  mapChatMessagesToStoredMessages,
} from "@langchain/core/messages";
import { and, eq } from "drizzle-orm";

export async function getthreadHistory({
  graph,
  threadID,
  userID,
}: {
  graph: any;
  threadID: string;
  userID: string;
}) {
  // todo need to check ownership does user is authenticated or not
  const check = await db
    .select()
    .from(thread)
    .where(and(eq(thread.id, threadID), eq(thread.userid, userID)))
    .limit(1);
  //Checking if isOwner not existed then returning not going further
  const isOwner = check.length > 0;
  if (!isOwner) {
    return [];
  }
  const config = { configurable: { thread_id: threadID } };
  const getstateData = await graph.getState(config);
  const messages = getstateData?.values?.message as BaseMessage[];
  // and this  function used to conver the based Message to StoredMESSAFE , check docs of langchain
  const storedMessage = mapChatMessagesToStoredMessages(messages);
  return storedMessage;
}
