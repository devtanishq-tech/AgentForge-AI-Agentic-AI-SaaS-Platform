"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { getOrCreateChat } from "@/store/data-store";
import InputContainer from "./input-container";
import NewConversation from "./ai-elements/newConversation";
import { StoredMessage } from "@langchain/core/messages";
import { convertLangChainToUI } from "@/lib/convertorfile";
import { Conversation, ConversationContent } from "./ai-elements/conversation";

export const ChatInterfaceNew = ({
  threadId,
  oldmessages,
}: {
  threadId: string;
  oldmessages: StoredMessage[];
}) => {
  // Created once per mount. If this thread already has a live Chat in memory,
  // that one is returned and oldmessages (DB) is ignored.
  const [chat] = useState(() =>
    getOrCreateChat(threadId, convertLangChainToUI(oldmessages)),
  );
  const { messages, status } = useChat({ chat }); // coming from vercel AI SDK useChat
  const queryClient = useQueryClient();

  // when a response finishes, the thread row exists in DB -> refresh sidebar
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== "ready" && status === "ready") {
      queryClient.invalidateQueries({ queryKey: ["thread"] });
    }
    prevStatus.current = status;
  }, [status, queryClient]);

  return (
    <>
      {messages.length === 0 ? (
        <div className="flex flex-col flex-1 h-full w-full min-h-0 overflow-y-scroll">
          <main className="h-full flex flex-col items-center  justify-end md:justify-center max-w-4xl mx-auto w-full px-4 -mt-20">
            <h1 className="text-3xl font-normal mb-8 tracking-tight text-white">
              What can I help with ?
            </h1>
            <InputContainer chat={chat} threadId={threadId} />
          </main>
        </div>
      ) : (
        <div className="flex flex-col flex-1 h-full w-full min-h-0 overflow-hidden">
          <div className="flex flex-col h-full w-full">
            <div className="flex-1 min-h-0">
              <Conversation className="h-full">
                <ConversationContent className="max-w-200 mx-auto px-4 pt-4 ">
                  <NewConversation messages={messages} />
                </ConversationContent>
              </Conversation>
            </div>
            <div>
              <InputContainer chat={chat} threadId={threadId} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
