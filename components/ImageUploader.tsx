"use client";

import React, { useRef, useState } from "react";

interface Props {
  label: string;
  description?: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  accentClass?: string;
  /** When true the preview keeps native aspect (e.g. for reference cards). */
  keepAspect?: boolean;
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

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
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
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
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
    </div>
  );
}
