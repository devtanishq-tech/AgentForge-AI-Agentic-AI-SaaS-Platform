"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

// Renders page 1 of a PDF (blob URL) to a small JPEG data URL.
function usePdfThumbnail(url: string, enabled: boolean) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | undefined;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const loadingTask = pdfjs.getDocument({ url });
        task = loadingTask;
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const base = page.getViewport({ scale: 1 });
        // 200px wide card, rendered at 2x so it stays sharp
        const viewport = page.getViewport({ scale: (200 / base.width) * 2 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvas,
          canvasContext: canvas.getContext("2d")!,
          viewport,
        }).promise;

        if (!cancelled) setThumb(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        // thumbnail is optional -> fall back to the icon placeholder
      }
    })();

    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [url, enabled]);

  return thumb;
}

function AttachmentCard({
  filename,
  mediaType,
  url,
  onRemove,
}: {
  filename?: string;
  mediaType?: string;
  url: string;
  onRemove: () => void;
}) {
  const isPdfOrImage = mediaType === "application/pdf";
  const isImage = mediaType?.startsWith("image/");
  const pdfThumb = usePdfThumbnail(url, isPdfOrImage);
  const preview = isImage ? url : pdfThumb;

  return (
    <div className="group relative w-50 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div className="flex h-28 items-center justify-center overflow-hidden bg-[#2a2a2a]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={filename ?? "attachment"}
            className="h-full w-full bg-white object-cover object-top"
          />
        ) : (
          <FileText size={28} className="text-[#9b9b9b]" />
        )}
      </div>

      <div className="flex items-center gap-2 px-2.5 py-2">
        <FileText size={16} className="shrink-0 text-[#e5484d]" />
        <span className="truncate text-sm text-zinc-100">
          {filename ?? "Untitled"}
        </span>
      </div>

      <button
        type="button"
        aria-label={`Remove ${filename ?? "file"}`}
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition-opacity hover:bg-black md:opacity-0 md:group-hover:opacity-100"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function AttachmentChips({ className }: { className?: string }) {
  const { files, remove } = usePromptInputAttachments();

  if (files.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2 px-3 pt-3 pb-1", className)}>
      {files.map((file) => (
        <AttachmentCard
          key={file.id}
          filename={file.filename}
          mediaType={file.mediaType}
          url={file.url}
          onRemove={() => remove(file.id)}
        />
      ))}
    </div>
  );
}
