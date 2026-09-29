import { GraphNode } from "@langchain/langgraph";
import { messageState } from "../state";
import { getMODEL } from "../model";
import { z } from "better-auth";
import { RouterPrompt } from "../prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const routeSchema = z.object({
  route: z
    .enum(["rag", "tool", "general"])
    .describe("Where to send the user's latest message"),
});

export const routerNode: GraphNode<typeof messageState> = async (state) => {
  const recent = state.messages
    .filter(
      (m) =>
        HumanMessage.isInstance(m) ||
        (AIMessage.isInstance(m) && !m.tool_calls?.length),
    )
    .map((m) => {
      const role = HumanMessage.isInstance(m) ? "user" : "assistant";
      const text =
        typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      return `${role}:${text}`;
    })
    .join("\n");
  try {
    const model =
      getMODEL("openai/gpt-oss-20b").withStructuredOutput(routeSchema);
    const response = await model.invoke(
      `${RouterPrompt}\n\nConversation:\n${recent}`,
    );
    console.log(`Route response`, response.route);
    return {
      route: response.route,
    };
  } catch (err) {
    console.error(`Error happen at Route Node`, err);
    return { route: "general" as const };
  }
};
