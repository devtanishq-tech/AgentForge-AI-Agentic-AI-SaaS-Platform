import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

export const messageState = new StateSchema({
  messages: MessagesValue,
  llmcalls: z.number(),
  route: z.enum(["rag", "tool", "general"]).optional(),
});
