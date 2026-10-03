"use client";

import { useParams, useRouter } from "next/navigation";
import { Plus, ArrowUp } from "lucide-react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { useState } from "react";
import { Chat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AttachmentChips } from "./attachment-chips";

type Thread = { title: string; id: string; createdAt: Date };

// Must live INSIDE <PromptInput> because it uses the attachments hook.
function InputBody({
  inputText,
  setInputText,
}: {
  inputText: string;
  setInputText: (v: string) => void;
}) {
  const { files, openFileDialog } = usePromptInputAttachments();
  const hasFiles = files.length > 0;
  const canSubmit = inputText.trim().length > 0 || hasFiles;

  return (
    <PromptInputBody className="grid w-full grid-cols-[auto_1fr_auto] items-end">
      {/* Row 1 (only when files exist): attachment cards */}
      {hasFiles && <AttachmentChips className="col-span-3 row-start-1" />}

      {/* + button: opens the file picker */}
      <button
        type="button"
        aria-label="Add files"
        onClick={openFileDialog}
        className={cn(
          "col-start-1 mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#b4b4b4] transition-colors hover:bg-[#3f3f3f]",
          hasFiles ? "row-start-3" : "row-start-1",
        )}
      >
        <Plus size={24} strokeWidth={1.5} />
      </button>

      {/* Textarea: sits beside the buttons normally, full width when files exist */}
      <div
        className={cn(
          "min-w-0 w-full",
          hasFiles ? "col-span-3 row-start-2" : "col-start-2 row-start-1",
        )}
      >
        <PromptInputTextarea
          onChange={(e) => {
            setInputText(e.target.value);
          }}
          value={inputText}
          placeholder="Ask anything"
          className="w-full flex items-center justify-center bg-transparent border-none focus:ring-0 focus-visible:ring-0 py-3 text-[18px] text-zinc-100 placeholder:text-[#676767] resize-none min-h-11 max-h-50 leading-tight"
        />
      </div>

      {/* Mic + send */}
      <div
        className={cn(
          "col-start-3 mb-0.5 flex shrink-0 items-center gap-2",
          hasFiles ? "row-start-3 pr-1" : "row-start-1",
        )}
      >
        <SpeechInput
          className="shrink-0 h-10 w-10 bg-transparent text-white"
          onTranscriptionChange={(text) => {}}
          size="icon-lg"
          variant="ghost"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUp />
        </button>
      </div>
    </PromptInputBody>
  );
}

function InputContainer({
  chat,
  threadId,
}: {
  chat: Chat<UIMessage>;
  threadId: string;
}) {
  const route = useRouter();
  const params = useParams();
  const finalThreadIDURL = params.thread_id;
  const [inputText, setinputText] = useState("");
  const queryClient = useQueryClient();
  return (
    <div className="flex flex-col items-center w-full max-w-200 mx-auto pb-6">
      <PromptInput
        className="w-full bg-[#2f2f2f] rounded-3xl [&>div]:h-auto!"
        accept="application/pdf"
        multiple
        maxFiles={5}
        maxFileSize={10 * 1024 * 1024}
        onError={(err) => toast.error(err.message)}
        onSubmit={(message) => {
          chat.sendMessage(message, {
            body: {
              threadId: threadId,
            },
          });
          // means we are at home page , where id does not exist pass the id to this path
          if (!finalThreadIDURL) {
            // show the new thread in the sidebar instantly (same 25-char title as the server)
            queryClient.setQueryData<Thread[]>(["thread"], (old = []) =>
              old.some((t) => t.id === threadId)
                ? old
                : [
                    {
                      id: threadId,
                      title:
                        (message.text ?? "").trim().slice(0, 25) ||
                        message.files?.[0]?.filename?.slice(0, 25) ||
                        "New chat",
                      createdAt: new Date(),
                    },
                    ...old,
                  ],
            );
            route.push(`/chat/${threadId}`);
          }
          setinputText("");
        }}
      >
        <InputBody inputText={inputText} setInputText={setinputText} />
      </PromptInput>
    </div>
  );
}

export default InputContainer;
