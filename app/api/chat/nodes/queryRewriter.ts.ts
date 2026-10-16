import { GraphNode } from "@langchain/langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import z from "zod";
import { messageState } from "../state";
import { getMODEL } from "../model";
import { QueryRewriterPrompt } from "../prompts";

const schema = z.object({
  queries: z.array(z.string()).min(1).max(3),
});

const textOf = (m: { content: unknown }) =>
  typeof m.content === "string" ? m.content : JSON.stringify(m.content);

export const queryRewriterNode: GraphNode<typeof messageState> = async (
  state,
) => {
  const lastHuman = [...state.messages]
    .reverse()
    .find((m) => HumanMessage.isInstance(m));
  const fallback = lastHuman ? textOf(lastHuman) : "";

  const recent = state.messages
    .filter(
      (m) =>
        HumanMessage.isInstance(m) ||
        (AIMessage.isInstance(m) && !m.tool_calls?.length),
    )
    .slice(-4)
    .map(
      (m) =>
        `${HumanMessage.isInstance(m) ? "user" : "assistant"}:${textOf(m)}`,
    )
    .join("\n");

  try {
    const model = getMODEL("openai/gpt-oss-20b").withStructuredOutput(schema);
    const res = await model.invoke(
      `${QueryRewriterPrompt}\n\nConversation:\n${recent}`,
    );
    console.log("Rewritten queries:", res.queries);
    return { queries: res.queries };
  } catch (err) {
    console.error("Query rewriter failed, using original message", err);
    return { queries: [fallback] };
  }
};
