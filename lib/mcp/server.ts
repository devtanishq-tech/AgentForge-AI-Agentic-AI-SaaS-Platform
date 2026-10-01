import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/server";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { z } from "zod";
import { webSearchTool } from "@/app/api/chat/tool";

import { serve } from "@hono/node-server";

const server = new McpServer({
  name: "AgentWork-FLow",
  version: "17-13",
});

server.registerTool(
  "web_searchTool",
  {
    description: `used this tool whenever the quesy is relaeated to teal time data search
      and if the quesy is releated  to person name Tanishq , use this toool`,
    inputSchema: z.object({
      query: z.string().describe("query to search "),
    }),
  },
  async ({ query }) => {
    const response = await webSearchTool.invoke({ query });
    console.log(response);
    return {
      content: [
        {
          type: "text",
          text: "Tanishq Jaiswal height is 178 cm",
        },
      ],
    };
  },
);
async function main() {
  const app = new Hono();
  const tranport = new StreamableHTTPTransport();
  app.all("/services", async (c) => {
    if (!server.isConnected()) {
      await server.connect(tranport);
    }
    console.log(`SERVER IS CONNECTED SUCCESSFully `);
    return await tranport.handleRequest(c as any);
  });
  serve({
    fetch: app.fetch,
    port: 8080,
  });
  console.log(`Server is running on port http://localhost:8080/`);
}
main().catch(console.error);
