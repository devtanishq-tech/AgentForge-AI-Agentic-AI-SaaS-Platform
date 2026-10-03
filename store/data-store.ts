import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";

function createChat(threadId: string, initialMessages: UIMessage[]) {
  // method used to create the Chat instance which has properties and function like messages,sendMessages,Status --Similar to use Chat
  return new Chat<UIMessage>({
    id: threadId,
    messages: initialMessages,
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

// One Chat per thread id. Lives in the browser only.
const chatRegistry = new Map<string, Chat<UIMessage>>();

export function getOrCreateChat(
  threadId: string,
  initialMessages: UIMessage[],
): Chat<UIMessage> {
  // On the server (SSR) never cache, otherwise chats could leak between users
  if (typeof window === "undefined") {
    return createChat(threadId, initialMessages);
  }
  let chat = chatRegistry.get(threadId);
  if (!chat) {
    chat = createChat(threadId, initialMessages);
    chatRegistry.set(threadId, chat);
  }
  return chat;
}

// call this on logout so the next user does not see old chats in memory
export function clearChatRegistry() {
  chatRegistry.clear();
}
