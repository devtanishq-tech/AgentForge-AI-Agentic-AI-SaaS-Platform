"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatInterfaceNew } from "@/components/chat-interface";

export default function NewChat() {
  const [threadId] = useState(() => uuidv4());
  return <ChatInterfaceNew threadId={threadId} oldmessages={[]} />;
}
