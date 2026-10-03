import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

export const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_KEY!,
});
export const pineconeINdex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
