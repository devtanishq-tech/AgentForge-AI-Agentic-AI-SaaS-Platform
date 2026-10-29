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
//=======todo create getPolarEvent function to fetch the model name //====

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
  return getmeter.result.items[0];
}

export async function getPolarSubscription() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must log in first.");
  }
  const response = await polarClient.subscriptions.list({
    externalCustomerId: session.user.id,
    limit: 10,
  });
  const subscriptions = response.result.items;
  console.log();
  const activeSubscription = subscriptions.find(
    (subscription) =>
      subscription.status === "active" || subscription.status === "trialing",
  );

  return {
    hasActiveSubscription: Boolean(activeSubscription),
    subscription: activeSubscription ?? null,
  };
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
