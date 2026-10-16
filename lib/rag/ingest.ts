import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pineconeINdex, pineconeSparseIndex, userNamespace } from "./pineconeD";
import { denseEmbedder, sparsedEmbedder } from "./embeeding";
import { v4 as uuidv4 } from "uuid";

export type VectorDatabaseType = {
  id: string;
  values: number[];
  metadata: {
    text: string;
    source: string;
    docId: string;
    chunkIndex: number;
  };
};
type ingestFileType = {
  file: Blob;
  fileName: string;
  userId: string;
};

async function upsertIndexFunction(index: any, records: any[]) {
  for (let i = 0; i < records.length; i += 100)
    await index.upsert({ records: records.slice(i, i + 100) });
}
export async function ingestion({ file, fileName, userId }: ingestFileType) {
  const pdfparser = new PDFLoader(file, { splitPages: false });
  const docs = await pdfparser.load();
  const pageContent = docs[0].pageContent ?? "";
  if (!pageContent.trim()) {
    throw new Error(
      "Page Content does exist ,there is not text , not able to split page  ",
    );
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });
  const chunks = await splitter.splitText(pageContent); // this is array of chunks
  // here we are using this promuse.all so that telling we need to execute this function then
  // run parallel manner ashynchronously
  const [dense, sparse] = await Promise.all([
    denseEmbedder(chunks),
    sparsedEmbedder(chunks, "passage"),
  ]);
  const docId = uuidv4();
  const metadata = (i: number) => ({
    text: chunks[i],
    source: fileName,
    docId,
    chunkIndex: i,
  });
  const denseRecords: VectorDatabaseType[] = chunks.map((_, i) => ({
    id: `${docId}#${i}`,
    values: dense[i],
    metadata: metadata(i),
  }));
  const sparseRecords = chunks.map((_, i) => ({
    id: `${docId}#${i}`,
    sparseValues: sparse[i],
    metadata: metadata(i),
  }));
  const nameSpace = userNamespace(userId);
  await Promise.all([
    await upsertIndexFunction(pineconeINdex.namespace(nameSpace), denseRecords),
    await upsertIndexFunction(
      pineconeSparseIndex.namespace(nameSpace),
      sparseRecords,
    ),
  ]);
  return { docId, fileName, chunks: chunks.length };
  // this retun will going to be used in uploads.route.ts file where
  // file data comes from backend side
}
