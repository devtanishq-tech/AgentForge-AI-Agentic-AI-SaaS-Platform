import { getActualModelId } from "../app/api/chat/model";

const tests = [
  {
    requested: "gemini-3.1-pro-preview",
    isPro: false,
  },
  {
    requested: "gemini-3.1-pro-preview",
    isPro: true,
  },
  {
    requested: "openai/gpt-oss-120b",
    isPro: false,
  },
];

for (const test of tests) {
  const actual = getActualModelId(test.requested, test.isPro);

  console.log({
    requested: test.requested,
    isPro: test.isPro,
    actual,
  });
}
