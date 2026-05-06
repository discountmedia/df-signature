"use client";

import React, { useEffect, useState } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { DEFAULT_EMPLOYEE, EmployeeData } from "@/lib/types";
import { LOCATIONS } from "@/lib/addresses";

const STORAGE_KEY = "df-signature-state-v2";

type GenState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "done"; imageDataUrl: string }
  | { status: "error"; message: string };

export default function Home() {
  const [data, setData] = useState<EmployeeData>(DEFAULT_EMPLOYEE);
  const [hydrated, setHydrated] = useState(false);
  const [gen, setGen] = useState<GenState>({ status: "idle" });

  // Browser memory: persist text fields only; image data is too large for localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<EmployeeData>;
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const { headshotDataUrl, referenceDataUrl, ...persistable } = data;
    void headshotDataUrl;
    void referenceDataUrl;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      /* quota / private mode */
    }
  }, [data, hydrated]);

  const canGenerate =
    !!data.headshotDataUrl &&
    !!data.referenceDataUrl &&
    data.name.trim().length > 0 &&
    data.title.trim().length > 0;

  async function handleGenerate() {
    if (!canGenerate) return;
    setGen({ status: "generating" });
    try {
      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceDataUrl: data.referenceDataUrl,
          headshotDataUrl: data.headshotDataUrl,
          name: data.name,
          title: data.title,
          hablaEspanol: data.hablaEspanol,
          smileEnhancement: data.smileEnhancement,
          lightingEnhancement: data.lightingEnhancement,
          cell: data.cell,
          main: data.main,
          email: data.email,
          website: data.website,
          address: LOCATIONS[data.location].address,
          activeCity: LOCATIONS[data.location].city,
        }),
      });
      const json = (await res.json()) as { imageDataUrl?: string; error?: string };
      if (!res.ok || !json.imageDataUrl) {
        throw new Error(json.error ?? "Generation failed");
      }
      setGen({ status: "done", imageDataUrl: json.imageDataUrl });
    } catch (err) {
      setGen({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  function handleDownload() {
    if (gen.status !== "done") return;
    const a = document.createElement("a");
    const safeName = data.name.replace(/[^a-zA-Z0-9_-]+/g, "_") || "signature";
    a.download = `${safeName}_${data.location}.png`;
    a.href = gen.imageDataUrl;
    a.click();
  }

  return (
    <main className="min-h-screen">
      {/* Unmissable version banner — if you don't see this, you are on the WRONG build */}
      <div className="bg-yellow-400 text-black text-center py-2 font-anton text-lg tracking-widest border-b-4 border-black">
        ⚡ BUILD v2.2 · NO POLISH BUTTON · HEADSHOT TOGGLES VISIBLE · NO CYAN PROMPT ⚡
      </div>

      <header className="border-b border-neutral-800 bg-black/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-df-red flex items-center justify-center text-white font-anton text-xl">
              DF
            </div>
            <div>
              <h1 className="font-anton text-2xl tracking-wider text-white leading-none">
                SIGNATURE CARD GENERATOR
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Discount Forklift · v2.1 (no polish button · always-on enhancement toggles)
              </p>
            </div>
          </div>
          <div className="text-xs text-neutral-500">
            Powered by <span className="text-df-orange font-bold">Gemini 3.1 Flash Image</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1500px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 self-start">
          <ControlPanel
            data={data}
            onChange={setData}
            onGenerate={handleGenerate}
            generating={gen.status === "generating"}
            canGenerate={canGenerate}
          />
        </aside>

        <section className="space-y-8">
          {/* RESULT */}
          <div>
            <SectionHeading
              eyebrow="Generated Card"
              title="Output"
              subtitle={
                gen.status === "done"
                  ? "Edited by Gemini · Click to download"
                  : "Generated card will appear here"
              }
            />
            <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 min-h-[400px] flex items-center justify-center relative">
              {gen.status === "idle" && (
                <EmptyState canGenerate={canGenerate} data={data} />
              )}
              {gen.status === "generating" && <GeneratingState />}
              {gen.status === "error" && <ErrorState message={gen.message} />}
              {gen.status === "done" && (
                <div className="w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gen.imageDataUrl}
                    alt="Generated signature card"
                    className="w-full h-auto block"
                  />
                  <div className="p-3 bg-black border-t border-neutral-800 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {data.name || "Signature card"} · {LOCATIONS[data.location].city}
                    </span>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-4 py-2 bg-df-red hover:bg-df-red/90 text-white font-bold text-sm rounded-md transition-colors"
                    >
                      ⬇ Download PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* REFERENCE PREVIEW (Field 2) */}
          {data.referenceDataUrl && (
            <div>
              <SectionHeading
                eyebrow="Field 2"
                title="Reference / Template"
                subtitle="Gemini will clone everything from this card except the photo and contact info"
              />
              <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.referenceDataUrl}
                  alt="Reference card"
                  className="w-full h-auto block opacity-80"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ canGenerate, data }: { canGenerate: boolean; data: EmployeeData }) {
  const missing: string[] = [];
  if (!data.referenceDataUrl) missing.push("Reference card (Field 2)");
  if (!data.headshotDataUrl) missing.push("Employee headshot (Field 1)");
  if (!data.name.trim()) missing.push("Employee name");
  if (!data.title.trim()) missing.push("Job title");

  return (
    <div className="text-center py-20 px-8">
      <div className="text-6xl mb-4 opacity-30">🖼️</div>
      <p className="text-neutral-400 text-sm mb-3 max-w-md mx-auto">
        Upload a reference card and an employee headshot, fill in the details on the left, then click <span className="text-df-orange font-bold">Generate Card</span>.
      </p>
      {!canGenerate && missing.length > 0 && (
        <div className="mt-4 inline-block text-left bg-neutral-900/50 border border-neutral-800 rounded-md p-3">
          <p className="text-xs text-neutral-500 mb-1.5 font-bold uppercase tracking-wide">Still needed:</p>
          <ul className="text-xs text-neutral-400 space-y-1">
            {missing.map((m) => (
              <li key={m}>· {m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="text-center py-20 px-8">
      <div className="inline-flex items-center gap-3 mb-4">
        <span className="w-3 h-3 rounded-full bg-df-orange animate-pulse" />
        <span className="w-3 h-3 rounded-full bg-df-orange animate-pulse" style={{ animationDelay: "0.15s" }} />
        <span className="w-3 h-3 rounded-full bg-df-orange animate-pulse" style={{ animationDelay: "0.3s" }} />
      </div>
      <p className="font-anton text-xl text-white tracking-wider">GEMINI IS CLONING THE CARD</p>
      <p className="text-xs text-neutral-500 mt-2">This typically takes 10–30 seconds.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 px-8 max-w-lg mx-auto">
      <div className="text-5xl mb-4">⚠️</div>
      <p className="font-bold text-df-red mb-2">Generation failed</p>
      <p className="text-xs text-neutral-400 break-words bg-neutral-900/50 border border-neutral-800 rounded-md p-3 text-left">
        {message}
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-anton tracking-[0.3em] text-df-orange uppercase">
        {eyebrow}
      </div>
      <div className="flex items-baseline gap-3 mt-1">
        <h2 className="font-anton text-2xl tracking-wider text-white">{title}</h2>
        {subtitle && <span className="text-xs text-neutral-500">{subtitle}</span>}
      </div>
    </div>
  );
}
