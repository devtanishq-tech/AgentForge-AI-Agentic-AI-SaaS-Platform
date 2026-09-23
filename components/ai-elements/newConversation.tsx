import React, { Fragment } from "react";
import { UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "./message";
import { RefreshCcwIcon, CopyIcon } from "lucide-react";
//telling typescript  what the type of message
function NewConversation({ messages }: { messages: UIMessage[] }) {
  {
    /*-
    
    ------------------------------------------
    ISSUE  UI COMPONENT RENDER , THEN AUTOSCROLL HAPPENS FROM THAT COMPONENT
    WHAT REALLY NEED TO HAPPEN - AS MESSAGE GOES DOWN , AUTOSCROOL HAPPEN 
    
    */
  }

  return (
    <>
      {messages.map((message, messageIndex) => (
        <Fragment key={message.id}>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                const isLastMessage = messageIndex === messages.length - 1;
                return (
                  <Fragment key={`${message.id}-${i}`}>
                    <Message from={message.role}>
                      <MessageContent>
                        <MessageResponse>{part.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                    {/*---------AI message  Prints component */}
                    {message.role === "assistant" && isLastMessage && (
                      <MessageActions>
                        <MessageAction
                          onClick={() => console.log("helo")}
                          label="Retry"
                        >
                          <RefreshCcwIcon className="size-3" />
                        </MessageAction>
                        <MessageAction
                          onClick={() =>
                            navigator.clipboard.writeText(part.text)
                          }
                          label="Copy"
                        >
                          <CopyIcon className="size-3" />
                        </MessageAction>
                      </MessageActions>
                    )}
                  </Fragment>
                );
              default:
                return null;
            }
          })}
        </Fragment>
      ))}
      <ConversationScrollButton />
    </>
  );
}

export default NewConversation;
