import { weatherTool, producttool, webSearchTool } from "./tool";
import { StructuredToolInterface } from "@langchain/core/tools";
const localtools: StructuredToolInterface[] = [
  weatherTool,
  producttool,
  webSearchTool,
];
export async function getTools(): Promise<StructuredToolInterface[]> {
  return localtools;
}
