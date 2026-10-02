import { getMCPTool } from "@/lib/mcp/client";
import { weatherTool, producttool, webSearchTool } from "./tool";
import { StructuredToolInterface } from "@langchain/core/tools";
// here passing this StxructuredToolInterface[] inside  localtools gurantied that
// that result fit compatible with the langgraph langchain
//guaranties that  inside this there is a fiild with the name
// name , desciption , invoke function , schema - inputScheam
// h here we have use this promise becaue conneting to mcp serber required prompts or asyn network
export async function getTools(): Promise<StructuredToolInterface[]> {
  return getMCPTool();
}
