import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { StructuredToolInterface } from "@langchain/core/tools";
let toolPromise: Promise<StructuredToolInterface[]> | null = null;
export async function getMCPTool() {
  if (!toolPromise) {
    const client = new MultiServerMCPClient({
      mcpServers: {
        agentForge: {
          transport: "http",
          url: process.env.MCP_SERVER_URL!,
        },
      },
      prefixToolNameWithServerName: false,
      // if we enables this ,
      // agentforge_weather_Search
      // agentforge_productTool
      // and on frontend side we dont want that , one the basics of
      // toolName  things are rendering
    });
    toolPromise = client.getTools().catch((error) => {
      console.log(error);
      toolPromise = null;
      throw error;
    });
  }
  return toolPromise;
}
