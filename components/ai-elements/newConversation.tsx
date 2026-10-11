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
import { RefreshCcwIcon, CopyIcon, FileTextIcon } from "lucide-react";
import { ProductCarousel } from "../genui/productcrousal";
import { WeatherCard, WeatherCardData } from "../genui/WeatherCard";
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
              case "file": {
                // attached file card, shown above the user's question
                return (
                  <Message key={`${message.id}-${i}`} from={message.role}>
                    <div className="flex w-fit max-w-xs items-center gap-3 self-end rounded-2xl border border-zinc-700 bg-[#2f2f2f] px-4 py-3">
                      <FileTextIcon className="size-6 shrink-0 text-red-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {part.filename ?? "Document"}
                        </p>
                        <p className="text-xs text-zinc-400">PDF</p>
                      </div>
                    </div>
                  </Message>
                );
              }
              case "text": {
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
              }
              case "dynamic-tool": {
                switch (part.toolName) {
                  case "productTool": {
                    if (part.state === "output-available") {
                      const toolData = (part.output as any).kwargs.content;
                      const parsedData = JSON.parse(toolData);
                      return (
                        <div key={part.toolCallId}>
                          <ProductCarousel
                            query={parsedData.query}
                            products={parsedData.products}
                          />
                        </div>
                      );
                    }
                    return null;
                  }
                  case "weather_Search": {
                    if (part.state === "output-available") {
                      const toolData = (part.output as any).kwargs.content;
                      const parsedData: WeatherCardData = JSON.parse(toolData);
                      return (
                        <div key={part.toolCallId}>
                          <WeatherCard data={parsedData} />
                        </div>
                      );
                    }
                    return null;
                  }
                  default:
                    return null;
                }
              }
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
