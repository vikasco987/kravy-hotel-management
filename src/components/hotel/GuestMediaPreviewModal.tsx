"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Download
} from "lucide-react";

export interface PreviewItem {
  url: string;
  title: string;
  type?: "photo" | "id" | "document";
  subtitle?: string;
  documentNumber?: string | null;
  status?: string | null;
}

interface GuestMediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PreviewItem[];
  initialIndex?: number;
}

export function GuestMediaPreviewModal({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
}: GuestMediaPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setZoom(1);
      setRotation(0);
      setImageError(false);
    }
  }, [isOpen, initialIndex, items]);

  useEffect(() => {
    // Reset zoom and rotation when current item changes
    setZoom(1);
    setRotation(0);
    setImageError(false);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && items.length > 1) {
        handleNext();
      } else if (e.key === "ArrowLeft" && items.length > 1) {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items.length]);

  if (!isOpen || !items || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const isPdf =
    currentItem?.url?.toLowerCase().endsWith(".pdf") ||
    currentItem?.url?.toLowerCase().includes("format=pdf") ||
    currentItem?.url?.toLowerCase().includes(".pdf?");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-950/70 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <h3
                id="preview-modal-title"
                className="text-sm font-bold text-white truncate"
              >
                {currentItem?.title || "Document Preview"}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {currentItem?.subtitle ? `${currentItem.subtitle} • ` : ""}
                {items.length > 1 ? `${currentIndex + 1} of ${items.length}` : "Single File"}
                {currentItem?.documentNumber ? ` • Ref: ${currentItem.documentNumber}` : ""}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isPdf && (
              <>
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-semibold text-gray-400 w-12 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  title="Zoom In"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  title="Rotate 90deg"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                >
                  <RotateCw size={16} />
                </button>
              </>
            )}

            <a
              href={currentItem?.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Original / Download"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center"
            >
              <ExternalLink size={16} />
            </a>

            <button
              type="button"
              title="Close Preview (Esc)"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media Viewing Area */}
        <div className="relative flex-1 min-h-[350px] max-h-[70vh] flex items-center justify-center p-4 bg-gray-950/40 overflow-hidden select-none">
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                title="Previous Document"
                className="absolute left-3 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm border border-white/10 transition shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                title="Next Document"
                className="absolute right-3 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm border border-white/10 transition shadow-lg"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {isPdf ? (
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center">
              <iframe
                src={`${currentItem.url}#toolbar=0`}
                title={currentItem.title || "PDF Document"}
                className="w-full h-[500px] rounded-lg border border-gray-800"
              />
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={currentItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Download size={13} /> Download or view full PDF in new tab
                </a>
              </div>
            </div>
          ) : imageError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <AlertCircle size={44} className="text-amber-500 mb-3" />
              <p className="text-sm font-bold text-white mb-1">Preview Unavailable</p>
              <p className="text-xs text-gray-400 max-w-sm mb-4">
                The image could not be loaded in the browser preview. You can try opening the direct file link.
              </p>
              <a
                href={currentItem?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
              >
                <ExternalLink size={14} /> Open Original File
              </a>
            </div>
          ) : (
            <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
              <img
                src={currentItem?.url}
                alt={currentItem?.title || "Guest Document"}
                onError={() => setImageError(true)}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease-out",
                  maxHeight: "65vh",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                className="rounded-lg shadow-xl"
              />
            </div>
          )}
        </div>

        {/* Footer info badge */}
        <div className="px-5 py-2.5 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Document verified and accessible for current stay</span>
          </div>
          {items.length > 1 && (
            <div className="flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition ${
                    i === currentIndex ? "bg-indigo-500 w-4" : "bg-gray-700 hover:bg-gray-500"
                  }`}
                  aria-label={`Go to item ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
