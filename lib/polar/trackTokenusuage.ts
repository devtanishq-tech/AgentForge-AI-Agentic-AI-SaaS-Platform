import { PolarINgestion } from "./polar_ingestion";

type Usage = {
  input: number;
  output: number;
  total: number;
};
//============need to fix this . when router node call for tools then error coming

export async function* trackTokenUsuageFunction(
  source: AsyncIterable<any>,
  userID: string,
  selectedModel: string,
): AsyncGenerator<any> {
  const usage: Usage = { input: 0, output: 0, total: 0 };

  try {
    for await (const event of source) {
      if (event.event === "on_chat_model_end") {
        const output = event.data?.output;

        // Support both LangChain and Groq usage formats.
        const metadata =
          output?.usage_metadata ?? output?.response_metadata?.usage;

        if (metadata) {
          const input = metadata.input_tokens ?? metadata.prompt_tokens ?? 0;

          const outputTokens =
            metadata.output_tokens ?? metadata.completion_tokens ?? 0;

          // Use input + output until the provider's total_tokens
          // value has been verified against actual usage.
          const total = input + outputTokens;

          usage.input += input;
          usage.output += outputTokens;
          usage.total += total;

          console.log("LLM Token Usage:", {
            node: event.metadata?.langgraph_node,
            model: output?.response_metadata?.model,
            input,
            output: outputTokens,
            total,
          });

          console.log("Cumulative Token Usage:", { ...usage });
        } else {
          console.warn("No token usage found:", event.metadata?.langgraph_node);
        }
      }

      yield event;
    }
  } finally {
    console.log("Final Token Usage:", { ...usage });
  }

  if (usage.total > 0) {
    try {
      await PolarINgestion({
        model: selectedModel,
        userID,
        inputToken: usage.input,
        outputToken: usage.output,
        totalToken: usage.total,
      });

      console.log("Token usage sent to Polar:", { ...usage });
    } catch (error) {
      console.error("Polar ingestion failed:", error);
    }
  } else {
    console.warn("No token usage recorded; Polar ingestion skipped.");
  }
}
