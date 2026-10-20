import { polarClient } from "../auth";
type ingestionData = {
  model: string;
  userID: string;
  inputToken: number;
  outputToken: number;
  totalToken: number;
};

export async function PolarINgestion(data: ingestionData) {
  await polarClient.events.ingest({
    events: [
      {
        name: "llm_tokens",
        externalCustomerId: data.userID,
        metadata: {
          model: data.model,
          input_token: data.inputToken,
          output_token: data.outputToken,
          total_token: data.totalToken,
        },
      },
    ],
  });
}
