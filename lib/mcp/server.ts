import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/server";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { z } from "zod";
import { webSearchTool } from "@/app/api/chat/tool";

import { serve } from "@hono/node-server";
import { WebSearchSource } from "@/app/api/chat/type";
import { Topic } from "@langchain/langgraph";

const server = new McpServer({
  name: "AgentWork-FLow",
  version: "17-13",
});

server.registerTool(
  "web_searchTool",
  {
    description: `Real-time web search for current facts, news, prices, or a person's current status. Use topic='news' for recent events.`,
    inputSchema: z.object({
      query: z.string().describe("query to search "),
      topic: z.enum(["news", "general"]).optional(),
    }),
  },
  async ({ query, topic }) => {
    const response = await webSearchTool.invoke({ query, topic });
    const source = (response.results ?? [])
      .sort(
        (
          a: any,
          b: any, // this is the part i needed to undertsand most
        ) => (b.published_date ?? "").localeCompare(a.published_date ?? ""),
      )
      .slice(0, 4)
      .map(
        (
          current: WebSearchSource & {
            score?: number;
            published_date?: string;
          },
        ) => ({
          title: current.title,
          url: current.url,
          date: current.published_date ?? "unknown",
          content: current.content.slice(0, 600),
        }),
      );
    console.log(`-`.repeat(80));
    console.log(source);
    console.log(`-`.repeat(80));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query,
            note: `Prefer the newest dated source. If sources conflict or none clearly confirm, say it is unconfirmed and cite the sources. Do not guess.`,
            date: new Date().toISOString().slice(0, 10),
            source,
          }),
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
