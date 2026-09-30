import { HumanMessage } from "@langchain/core/messages";

export function getRecentTurns(messages: any[], turnCount: number) {
  const humanIndexes = messages
    .map((message, index) => (HumanMessage.isInstance(message) ? index : -1))
    .filter((index) => index !== -1);

  const startIndex = humanIndexes.at(-turnCount) ?? 0;

  return messages.slice(startIndex);
}
