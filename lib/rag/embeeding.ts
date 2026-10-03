import { pipeline } from "@xenova/transformers";

export const embeeder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);
