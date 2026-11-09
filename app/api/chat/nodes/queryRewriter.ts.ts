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

const MAX_HISTORY_CHARS = 300;
const clip = (s: string) =>
  s.length > MAX_HISTORY_CHARS ? `${s.slice(0, MAX_HISTORY_CHARS)}…` : s;

// Several asks in one message -> may need decomposition
// there are called regex in js
// means we are defining a regex
const MULTI_PART = /\b(and|also|as well as|plus|along with)\b|[,;]|\?.*\?/i;

// Depends on earlier messages (only checked when history exists)
const FOLLOW_UP =
  /^\s*(and|also|what about|how about|then|so|but|ok|okay)\b|\b(it|its|they|them|their|this|that|these|those|he|she|his|her|there|same|above|previous|former|latter|first|second|third|last|one)\b/i;

// Filler / document references that should be stripped
const FILLER =
  /\b(this|the|my|attached|uploaded)\s+(pdf|document|doc|file)\b|\bfrom\s+(the\s+)?(pdf|document|doc|file)\b|\b(tell me|please|can you|could you|i want to know|let me know)\b/i;

const needsRewrite = (q: string, hasHistory: boolean) =>
  MULTI_PART.test(q) ||
  FILLER.test(q) ||
  (hasHistory && (FOLLOW_UP.test(q) || q.split(/\s+/).length <= 4));

export const queryRewriterNode: GraphNode<typeof messageState> = async (
  state,
) => {
  const turns = state.messages.filter(
    (m) =>
      HumanMessage.isInstance(m) ||
      (AIMessage.isInstance(m) && !m.tool_calls?.length),
  );
  const lastIdx = turns.findLastIndex((m) => HumanMessage.isInstance(m));
  const latest = lastIdx >= 0 ? textOf(turns[lastIdx]).trim() : "";
  const history = turns.slice(Math.max(0, lastIdx - 3), Math.max(0, lastIdx));

  // Bypass: already self-contained, skip the LLM
  if (!latest || !needsRewrite(latest, history.length > 0)) {
    console.log("Query rewriter bypassed, using original query");
    return { queries: [latest] };
  }

  const historyText = history
    .map(
      (m) =>
        `${HumanMessage.isInstance(m) ? "user" : "assistant"}: ${clip(textOf(m))}`,
    )
    .join("\n");

  try {
    const { model } = getMODEL("openai/gpt-oss-20b");
    const structuredModel = model.withStructuredOutput(schema);
    const res = await structuredModel.invoke(
      `${QueryRewriterPrompt}\n\nHistory:\n${historyText || "(none)"}\n\nLatest user message:\n${latest}`,
    );

    // Clean + dedupe
    const seen = new Set<string>();
    const cleaned: string[] = [];
    for (const q of res.queries) {
      const t = q.trim();
      if (t && !seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        cleaned.push(t);
      }
    }

    // Guard: no multi-part signal -> never more than one query
    const queries = MULTI_PART.test(latest) ? cleaned : cleaned.slice(0, 1);
    const finalQueries = queries.length ? queries : [latest];

    console.log("Rewritten queries:", finalQueries);
    return { queries: finalQueries };
  } catch (err) {
    console.error("Query rewriter failed, using original message", err);
    return { queries: [latest] };
  }
};
