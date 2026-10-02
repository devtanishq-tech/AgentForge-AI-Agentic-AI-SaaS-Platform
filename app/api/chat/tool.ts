import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { getJson } from "serpapi";
import { TavilySearch } from "@langchain/tavily";
import { productFromAPI, WeatherResponse } from "./type";
import { Topic } from "@langchain/langgraph";
const tavilySearch = new TavilySearch({
  maxResults: 6,
  searchDepth: "advanced",
  includeAnswer: false,
  tavilyApiKey: process.env.TAVILY_SEARCH_API,
});

export const webSearchTool = tool(
  async ({ query, topic }) => {
    const timeRange = topic === "news" ? "month" : undefined;
    const responeData = await tavilySearch.invoke({
      query,
      topic: topic ?? "general",
      timeRange,
    });
    return responeData;
  },
  {
    name: "web_search",
    description: "Search the web for current or real-time information.",
    schema: z.object({
      query: z.string().describe("Focused search query."),
      topic: z
        .enum(["general", "news"])
        .optional()
        .describe("Use 'news' for recent events or a person's current status."),
    }),
  },
);
export const weatherTool = tool(
  async ({ location }) => {
    const url = new URL("http://api.weatherapi.com/v1/current.json");
    url.searchParams.set("key", process.env.WEATHER_API_KEY!);
    url.searchParams.set("q", location);
    const response = await fetch(url);
    console.log(`Weather tools is called `);
    const responseData = await response.json();
    const weatherResponse: WeatherResponse = {
      location: {
        name: responseData.location.name,
        region: responseData.location.region,
        country: responseData.location.country,
      },
      temperature: responseData.current.temp_c,
      feelsLike: responseData.current.feelslike_c,
      condition: {
        text: responseData.current.condition.text,
        icon: responseData.current.condition.icon,
      },
      humidity: responseData.current.humidity,
      wind: {
        speed: responseData.current.wind_kph,
        direction: responseData.current.wind_dir,
      },
      precipitation: responseData.current.precip_mm,
      rainChance: responseData.current.chance_of_rain,
      visibility: responseData.current.vis_km,
      uvIndex: responseData.current.uv,
      isDay: responseData.current.is_day,
      lastUpdated: responseData.current.last_updated,
    };
    console.log(weatherResponse);
    return weatherResponse;
  },
  {
    name: "weather_Search",
    description: "Get the current weather information for a given location.",
    schema: z.object({
      location: z.string().describe("City or location name"),
    }),
  },
);
export const producttool = tool(
  async ({ query, location = "India" }) => {
    try {
      const response = await getJson({
        engine: "google_shopping",
        q: query,
        location: location,
        api_key: process.env.SERP_API_KEY,
        num: 5,
      });
      if (
        !response.shopping_results ||
        response.shopping_results.length === 0
      ) {
        return {
          query,
          products: [],
        };
      }
      const products = response.shopping_results
        .slice(0, 6)
        .map((current: productFromAPI, index: number) => {
          return {
            id: current.product_id || String(index),
            title: current.title,
            price: current.price,
            extracted_price: current.extracted_price,
            source: current.source,
            rating: current.rating,
            reviews: current.reviews,
            thumbnail: current.thumbnail,
            product_Link:
              current.product_link + `&utm_source=agentforge-ai.com`,
            source_image_Link: current.source_icon,
          };
        });
      //
      return {
        query,
        products,
      };
    } catch (err) {
      console.error(`Error occur at product-Toolcalling `, err);
      return {
        query,
        products: [],
      };
    }
  },
  {
    name: "productTool",
    description:
      "Use this tool when the user asks about a specific purchasable product — prices, availability, comparisons across sellers, ratings, or shopping links. Returns structured product data (title, price, source, rating, reviews, link) via Google Shopping. Use web_search instead for general or real-time info not tied to a specific product.",
    schema: z.object({
      query: z.string().describe("Product search query"),
      location: z
        .string()
        .optional()
        .describe(
          "Search location; use the location from the query if given, otherwise default to India",
        ),
    }),
  },
);
