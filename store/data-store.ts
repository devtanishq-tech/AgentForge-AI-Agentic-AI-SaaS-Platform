import { create } from "zustand";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
type chatStoreState = {
  chatinstance: Chat<UIMessage>;
};
function cretaeChAT() {
  // method used to create the Chat instance which has properties and function like messages,sendMessages,Status --Similar to use Chat \
  return new Chat<UIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, messageId, body }) => {
        const lastMesage = messages.slice(-1); // fetching only last message data
        let messageContent = "";
        if (lastMesage[0].parts[0].type === "text") {
          //checking  doeslast message type ifs text , cuz it can be voice , file from input section of frontend side
          messageContent = lastMesage[0].parts[0].text;
        }
        return {
          body: {
            threadID: body?.threadId,
            messaegTextBodyContent: messageContent, // Only send  first message if type if text only
            messageId,
          },
        };
      },
    }),
  });
}

export const useChatStore = create<chatStoreState>((set) => ({
  chatinstance: cretaeChAT(),
}));
