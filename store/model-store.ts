import { create } from "zustand";
import type { ModelId } from "@/lib/ai/model-types";

interface ModelStore {
  selectedModel: ModelId;
  setSelectedModel: (model: ModelId) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
  selectedModel: "openai/gpt-oss-120b",

  setSelectedModel: (model) => set({ selectedModel: model }),
}));
