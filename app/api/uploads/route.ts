import { auth } from "@/lib/auth";
import { ingestion } from "@/lib/rag/ingest";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // first we need to extarct the user id ?
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user.id) {
    // this how we send response in Next js
    return new Response("Unauthorized", { status: 401 });
  }
  const form = await request.formData(); //this function used to get the formDATA , like how it actually looks ;like
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return Response.json(
      { error: "Only PDF files are supported" },
      { status: 400 },
    );
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json(
      { error: "File too large (max 10 MB)" },
      { status: 413 },
    );
  }

  try {
    const result = await ingestion({
      file,
      fileName: file.name,
      userId: session.user.id,
    });
    return Response.json(result);
  } catch (err) {
    console.error("Ingestion failed", err);
    return Response.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
