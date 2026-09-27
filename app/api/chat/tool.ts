import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { getJson } from "serpapi";
type productFromAPI = {
  product_id: string;
  title: string;
  price: string;
  extracted_price: number;
  source: string;
  rating: number;
  reviews: number;
  thumbnail: string;
  product_link: string;
  source_icon: string;
};
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
      console.log(`--------------------------------------------`);
      console.log(response);
      console.log(`-----------------------------------------`);
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
      console.log(`response`, products);
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
      "Search Google Shopping for products, prices, and availability.",
    schema: z.object({
      query: z.string().describe("Product search query"),
      location: z
        .string()
        .optional()
        .describe(
          "Search location, like for location used if  location is come from query and if not use deafult location India ",
        ),
    }),
  },
);
