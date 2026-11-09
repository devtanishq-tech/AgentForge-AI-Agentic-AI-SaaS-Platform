import { GraphNode } from "@langchain/langgraph";
import { messageState } from "../state";
import { getMODEL } from "../model";
import { RouterPrompt } from "../prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import z from "zod";
const routeSchema = z.object({
  route: z
    .enum(["rag", "tool", "general"])
    .describe("Where to send the user's latest message"),
});
const textOf = (m: { content: unknown }) =>
  typeof m.content === "string" ? m.content : JSON.stringify(m.content);
// Explicit document reference -> always rag
const DOC_CUE =
  /\b(pdf|document|doc|file|uploaded|attached|according to|in the doc)\b/i;
// Previous assistant answer came from the RAG path
const RAG_ANSWER_CUE = /\[\d+\]|uploaded documents|couldn't find it in/i;
// Clear topic change away from the document
const LIVE_CUE =
  /\b(weather|forecast|news|headlines|stock|search the web|google|near me|how much is|price of|buy|purchase|shopping|iphone)\b/i;
const SMALL_TALK_CUE =
  /^\s*(hi|hello|hey|thanks|thank you|ok|okay|bye|good morning|good night)\b/i;
const CODE_CUE = /```|\b(write (a )?(function|code|script)|debug|regex)\b/i;

export const routerNode: GraphNode<typeof messageState> = async (state) => {
  const turns = state.messages.filter(
    (m) =>
      HumanMessage.isInstance(m) ||
      (AIMessage.isInstance(m) && !m.tool_calls?.length),
  );

  const latestHuman = turns.findLast((m) => HumanMessage.isInstance(m));
  const latest = latestHuman ? textOf(latestHuman) : "";
  const lastAssistant = turns.findLast((m) => AIMessage.isInstance(m));
  const inDocConversation = lastAssistant
    ? RAG_ANSWER_CUE.test(textOf(lastAssistant))
    : false;

  // Rule 1: explicit document reference
  if (DOC_CUE.test(latest)) {
    console.log("Router (rule): explicit document cue -> rag");
    return { route: "rag" as const };
  }

  // Rule 2: stay in rag during a document conversation unless clear topic change
  if (
    inDocConversation &&
    !LIVE_CUE.test(latest) &&
    !SMALL_TALK_CUE.test(latest) &&
    !CODE_CUE.test(latest)
  ) {
    console.log("Router (rule): document conversation follow-up -> rag");
    return { route: "rag" as const };
  }

  // Otherwise let the LLM decide
  const recent = turns
    .slice(-6)
    .map(
      (m) =>
        `${HumanMessage.isInstance(m) ? "user" : "assistant"}:${textOf(m)}`,
    )
    .join("\n");
  try {
    const { model } = getMODEL("openai/gpt-oss-20b");
    const structuredModel = model.withStructuredOutput(routeSchema);
    const response = await structuredModel.invoke(
      `${RouterPrompt}\n\nConversation:\n${recent}`,
    );
    console.log(`-`.repeat(100));
    console.log(`Router Response:${response.route}`);
    console.log(`-`.repeat(100));
    return { route: response.route };
  } catch (err) {
    console.error(`Error happen at Route Node`, err);
    return { route: "general" as const };
  }
};
