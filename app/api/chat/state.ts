import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

export const messageState = new StateSchema({
  message: MessagesValue,
  llmcalls: z.number(),
});
