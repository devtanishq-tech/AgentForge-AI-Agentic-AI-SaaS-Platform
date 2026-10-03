import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pineconeINdex } from "./pineconeD";
import { embeeder } from "./embeeding";
export type VectorRecord = {
  id: string;
  values: number[];
  metadata: {
    text: string;
    source: string;
  };
};

export async function ingestion(filepath: string) {
  const loader = new PDFLoader(filepath, { splitPages: false });
  const docs = await loader.load();
  const pageContents = docs[0].pageContent;
  //========================chunking of the document //==========================
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  const text = await splitter.splitText(pageContents);
  const record: VectorRecord[] = [];
  //======================emebedding conversion //=============================

  for (let i = 0; i < text.length; i++) {
    const chunks = text[i];
    const output = await embeeder(chunks, {
      pooling: "mean",
      normalize: true,
    });
    record.push({
      id: `${Date.now()}chunks-${i}`,
      values: Array.from(output.data), // this where vector array will get stored
      metadata: {
        text: chunks,
        source: "../Nexora_Internal_KB_RAG.pdf",
      },
    });
    //==================Stroing vectors inside the vectors //=================
  }
  await pineconeINdex.upsert({
    records: record,
  });
  console.log(
    `data has been successfully inserted , check pinecone databse...`,
  );
}
