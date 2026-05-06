"use client";

import React, { useRef, useState } from "react";

interface Props {
  label: string;
  description?: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  accentClass?: string;
  keepAspect?: boolean;
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.9;

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({
  label,
  description,
  value,
  onChange,
  accentClass = "border-df-cyan",
  keepAspect = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setError(null);
    setProcessing(true);
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold tracking-wide text-neutral-200 uppercase">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-neutral-400 hover:text-df-red transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {description && (
        <p className="text-xs text-neutral-500 leading-relaxed">{description}</p>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer border-2 border-dashed rounded-lg
          flex items-center justify-center transition-all overflow-hidden
          ${dragOver ? "border-df-orange bg-df-orange/5" : `${accentClass} bg-neutral-900/40`}
          ${keepAspect ? "aspect-[1000/838]" : "aspect-square"}
          hover:border-df-orange hover:bg-df-orange/5
        `}
      >
        {processing ? (
          <div className="text-center px-4 py-8 text-neutral-400">
            <div className="text-sm font-medium animate-pulse">Compressing…</div>
          </div>
        ) : value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value}
            alt={label}
            className={keepAspect ? "w-full h-full object-contain" : "w-full h-full object-cover"}
          />
        ) : (
          <div className="text-center px-4 py-8 text-neutral-400">
            <div className="text-3xl mb-2">⬆</div>
            <div className="text-sm font-medium">Click or drop image</div>
            <div className="text-xs text-neutral-500 mt-1">PNG / JPG / WebP</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && <p className="text-xs text-amber-400">{error}</p>}
    </div>
  );
}