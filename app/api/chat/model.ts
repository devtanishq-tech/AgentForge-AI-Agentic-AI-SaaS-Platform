import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
//================================================types ================================================//
export type ModelId =
  | "openai/gpt-oss-120b"
  | "gemini-3.1-pro-preview"
  | "openai/gpt-oss-20b";

//======================\

export function isModelId(value: unknown): value is ModelId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(MODELREGISTRY, value)
  );
}
//======================
type modelProvider = "groq" | "google" | "anthropic";
type modelTier = "free" | "subscription";
type ReasoningEffort = "low" | "high" | "medium";
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
const MODELREGISTRY: Record<ModelId, modelConfig> = {
  "openai/gpt-oss-120b": {
    provider: "groq",
    tier: "free",
    options: { reasoningEffort: "medium", temperature: 0 },
  },
  "openai/gpt-oss-20b": {
    provider: "groq",
    tier: "free",
    options: { reasoningEffort: "medium", temperature: 0 },
  },
  "gemini-3.1-pro-preview": {
    provider: "google",
    tier: "subscription",
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
function createModel(modelId: ModelId, config: modelConfig) {
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
// Implementing getActualmode id -

//====================================================================//

const DEFAULT_MODEL_ID: ModelId = "openai/gpt-oss-120b";

export function getActualModelId(
  modelId: ModelId,
  userHaveProPlan: boolean,
): ModelId {
  const config = MODELREGISTRY[modelId];

  if (!config) {
    throw new Error(`Unsupported model: ${modelId}`);
  }

  if (config.tier === "subscription" && !userHaveProPlan) {
    return DEFAULT_MODEL_ID;
  }

  return modelId;
}
//====================================================================//
export function getMODEL(modelId: ModelId, userHaveProPlan: boolean = false) {
  const actualModelId = getActualModelId(modelId, userHaveProPlan);
  const config = MODELREGISTRY[actualModelId];
  return {
    model: createModel(actualModelId, config),
    actualModelId,
  };
}
