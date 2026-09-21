import { Agent } from "@/components/ai-elements/agent";
import { ChatInterfaceNew } from "@/components/chat-interface";
import { getthreadHistory } from "@/lib/conversationHistory";
import { finalGraph } from "@/app/api/chat/graph";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  const { thread_id } = await params;
  const getSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!getSession) {
    redirect("/auth/signin");
  }
  const userid = getSession?.user.id;
  const conversationHistory = await getthreadHistory({
    graph: finalGraph,
    threadID: thread_id as string,
    userID: userid,
  });
  console.log(
    `-==============================================================`,
  );
  console.log(JSON.stringify(conversationHistory, null, 2));
  console.log(
    `-==============================================================`,
  );
  return (
    <>
      <ChatInterfaceNew oldmessages={conversationHistory} />
    </>
  );
}
