import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/server";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { z } from "zod";
import { producttool, weatherTool, webSearchTool } from "@/app/api/chat/tool";

import { serve } from "@hono/node-server";
import { WebSearchSource } from "@/app/api/chat/type";

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
server.registerTool(
  "weather_Search",
  {
    description:
      "Current weather (temp °C, condition, humidity, wind, rain, UV) for a city or place. Current conditions only, no forecast.",
    inputSchema: z.object({
      location: z
        .string()
        .describe("City or place name, e.g. 'Delhi' or 'London, UK'"),
    }),
  },
  async ({ location }) => {
    const weatherResult = await weatherTool.invoke({ location });
    console.log(`-`.repeat(80));
    console.log(weatherResult);
    console.log(`-`.repeat(80));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(weatherResult),
        },
      ],
    };
  },
);
server.registerTool(
  "productTool",
  {
    description:
      "Google Shopping search for a specific product: price, seller, rating, reviews, buy link. Not for general info or news.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Product name with key specs, e.g. 'iPhone 15 128GB'"),
      location: z
        .string()
        .optional()
        .describe("Country or city for pricing. Defaults to India."),
    }),
  },
  async ({ query, location }) => {
    const result = await producttool.invoke({ query, location });
    const products = (result.products ?? []).map(
      ({ thumbnail, source_image_Link, extracted_price, ...rest }: any) => rest,
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query,
            note: products.length
              ? "Use only these prices and sellers. Do not invent or estimate any."
              : "No results found. Say so; do not guess prices.",
            products,
          }),
        },
      ],
    };
  },
);
server.registerTool(
  "productTool",
  {
    description:
      "Google Shopping search for a specific product: price, seller, rating, reviews, buy link. Not for general info or news.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Product name with key specs, e.g. 'iPhone 15 128GB'"),
      location: z
        .string()
        .optional()
        .describe("Country or city for pricing. Defaults to India."),
    }),
  },
  async ({ query, location }) => {
    const result = await producttool.invoke({ query, location });
    const products = result.products ?? [];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query,
            note: products.length
              ? "Use only these prices and sellers. Do not invent or estimate any."
              : "No results found. Say so; do not guess prices.",
            products,
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
