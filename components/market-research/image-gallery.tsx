"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface GalleryImage {
  id: string;
  thumbnailUrl: string | null;
  fullUrl: string | null;
  originalFilename: string;
}

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const active = openIndex !== null ? images[openIndex] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setOpenIndex(i)}
            className="rounded-md overflow-hidden border shrink-0"
            style={{ borderColor: "var(--color-bg-border)", width: 160, height: 112 }}
          >
            {img.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.thumbnailUrl}
                alt={img.originalFilename}
                className="w-full h-full object-cover transition-transform duration-150 hover:scale-[1.03]"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xs"
                style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}
              >
                unavailable
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-4xl bg-[var(--color-bg-elevated)] border-[var(--color-bg-border)]">
          <DialogTitle className="text-xs font-normal truncate" style={{ color: "var(--color-text-muted)" }}>
            {active?.originalFilename ?? "Chart"}
          </DialogTitle>
          {active?.fullUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={active.fullUrl}
              alt={active.originalFilename}
              className="w-full h-auto max-h-[75vh] object-contain rounded-md"
            />
          )}
          {images.length > 1 && (
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setOpenIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length))}
                className="p-2 rounded-md"
                style={{ color: "var(--color-text-muted)" }}
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {(openIndex ?? 0) + 1} / {images.length}
              </span>
              <button
                onClick={() => setOpenIndex((i) => (i === null ? 0 : (i + 1) % images.length))}
                className="p-2 rounded-md"
                style={{ color: "var(--color-text-muted)" }}
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
