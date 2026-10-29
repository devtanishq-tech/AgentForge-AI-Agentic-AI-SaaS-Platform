"use server";
import { auth, polarClient } from "../auth";
import { headers } from "next/headers";
type ingestionData = {
  model: string;
  userID: string;
  inputToken: number;
  outputToken: number;
  totalToken: number;
};

export async function getPolarMeters() {
  const isloggedin = await auth.api.getSession({
    headers: await headers(),
  });
  if (!isloggedin) {
    throw new Error("You are not log in , first log in ");
  }
  const getmeter = await polarClient.customerMeters.list({
    //not using orinization id , using application main user id ,
    externalCustomerId: isloggedin.user.id,
  });
  console.log(`--`.repeat(100));
  console.log(`Meter info ----`, getmeter.result.items);
  console.log(`--`.repeat(100));
  return getmeter.result.items;
}

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
