import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
//================================================types ================================================//
type modelId = "openai/gpt-oss-120b" | "gemini-2.5-pro" | "Claude 4 Sonnet";
type modelProvider = "groq" | "google" | "anthropic";
type modelTier = "free" | "subscription";
type ReasoningEffort = "low" | "high" | "default";
type modelConfig = {
  provider: modelProvider;
  tier: modelTier;
  options?: {
    reasoningEffort?: ReasoningEffort;
    thinkingBudget?: number;
    temperature?: number;
  };
};
//=================================================Model Registry //=======================================//
const MODELREGISTRY: Record<modelId, modelConfig> = {
  "openai/gpt-oss-120b": {
    provider: "groq",
    tier: "free",
    options: { reasoningEffort: "low", temperature: 0 },
  },
  "Claude 4 Sonnet": {
    provider: "anthropic",
    tier: "subscription",
    options: { reasoningEffort: "low", temperature: 0 },
  },
  "gemini-2.5-pro": {
    provider: "google",
    tier: "free",
    options: { thinkingBudget: 8192, temperature: 0 },
  },
};
//===========================================Functions //===============================///
function getDefault() {
  return new ChatGroq({
    model: "openai/gpt-oss-120b",
    reasoningEffort: "low",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
  });
}
function createModel(modelId: modelId, config: modelConfig) {
  if (config.provider === "groq") {
    return new ChatGroq({
      model: modelId,
      reasoningEffort: config.options?.reasoningEffort,
      temperature: config.options?.temperature,
      apiKey: process.env.GROQ_API_KEY,
    });
  } else {
    return new ChatGoogleGenerativeAI({
      model: modelId,
      thinkingConfig: {
        thinkingBudget: config.options?.thinkingBudget,
      },
      temperature: config.options?.temperature,
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }
}
export function getMODEL(modelId: modelId) {
  const config = MODELREGISTRY[modelId];
  if (!config) {
    return getDefault();
  }
  if (config.tier === "subscription") {
    // will implement this later
  }
  return createModel(modelId, config);
}
