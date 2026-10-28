import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pineconeINdex, pineconeSparseIndex, userNamespace } from "./pineconeD";
import { denseEmbedder, sparsedEmbedder } from "./embeeding";
import { v4 as uuidv4 } from "uuid";
//=======================================================//
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
//=====================================================//
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

  //=================================================//
  const evaluationData = {
    docId,
    fileName,
    namespace: nameSpace,
    totalChunks: chunks.length,
    chunks: chunks.map((chunk, i) => ({
      id: `${docId}#${i}`,
      chunkIndex: i,
      textLength: chunk.length,
      metadata: {
        source: fileName,
        docId,
        chunkIndex: i,
      },
      text: chunk,
    })),
  };

  // 3. Print every chunk and its metadata in the terminal.
  console.log("\n========== RAG INGESTION REPORT ==========");
  console.log(`File: ${fileName}`);
  console.log(`Document ID: ${docId}`);
  console.log(`Namespace: ${nameSpace}`);
  console.log(`Total chunks: ${chunks.length}`);
  console.log("==========================================\n");

  for (const chunk of evaluationData.chunks) {
    console.log(`\n========== CHUNK ${chunk.chunkIndex} ==========`);
    console.log(`ID: ${chunk.id}`);
    console.log(`Text Length: ${chunk.textLength}`);
    console.log("Metadata:", chunk.metadata);
    console.log("Text:\n", chunk.text);
  }

  // 4. Export all chunks to a JSON file.
  const exportDir = path.join(process.cwd(), "rag-evaluation");

  await mkdir(exportDir, { recursive: true });

  const exportPath = path.join(exportDir, `chunks-${docId}.json`);

  await writeFile(exportPath, JSON.stringify(evaluationData, null, 2), "utf-8");

  console.log("\n========== EXPORT COMPLETED ==========");
  console.log(`Exported ${chunks.length} chunks`);
  console.log(`JSON file: ${exportPath}`);
  console.log("======================================\n");
  //=================================================//
  return { docId, fileName, chunks: chunks.length };
  // this retun will going to be used in uploads.route.ts file where
  // file data comes from backend side
}
