"use client";

import React from "react";
import { EmployeeData } from "@/lib/types";
import { LOCATIONS, LocationKey } from "@/lib/addresses";
import { ImageUploader } from "./ImageUploader";

interface Props {
  data: EmployeeData;
  onChange: (next: EmployeeData) => void;
  onGenerate: () => void;
  generating: boolean;
  canGenerate: boolean;
}

export function ControlPanel({ data, onChange, onGenerate, generating, canGenerate }: Props) {
  const update = <K extends keyof EmployeeData>(key: K, value: EmployeeData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-7">
      {/* ============= TWIN UPLOADER ============= */}
      <Section title="Source Images">
        <div className="grid grid-cols-2 gap-3">
          <ImageUploader
            label="① Headshot"
            description="The new employee's photo. Replaces the circular photo on the card."
            value={data.headshotDataUrl}
            onChange={(v) => update("headshotDataUrl", v)}
            accentClass="border-df-green"
          />
          <ImageUploader
            label="② Reference Card *"
            description="An existing Discount Forklift card. Gemini will clone its design exactly."
            value={data.referenceDataUrl}
            onChange={(v) => update("referenceDataUrl", v)}
            accentClass="border-df-cyan"
            keepAspect
          />
        </div>
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          <span className="text-df-cyan font-bold">*</span> The reference is the design template — without it, Gemini has nothing to clone.
        </p>
      </Section>

      {/* ============= HEADSHOT ENHANCEMENTS (always visible) ============= */}
      <Section title="Headshot Enhancements">
        <Toggle
          label="Add a natural smile"
          description="Ask Gemini to give the person a warm, professional smile"
          checked={data.smileEnhancement}
          onChange={(v) => update("smileEnhancement", v)}
        />
        <Toggle
          label="Improve studio lighting"
          description="Even out the lighting like a professional headshot"
          checked={data.lightingEnhancement}
          onChange={(v) => update("lightingEnhancement", v)}
        />
      </Section>

      {/* ============= EMPLOYEE INFO ============= */}
      <Section title="Employee">
        <Field label="Full Name">
          <input
            type="text"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            placeholder="Consuelo Muñoz"
          />
        </Field>

        <Field label="Job Title">
          <input
            type="text"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
            placeholder="Equipment Matchmaker"
          />
        </Field>

        <Field label="Language Line">
          <button
            type="button"
            onClick={() => update("hablaEspanol", !data.hablaEspanol)}
            className={`
              w-full px-4 py-3 rounded-md font-bold text-sm tracking-wide transition-all border-2
              ${
                data.hablaEspanol
                  ? "bg-df-green/20 border-df-green text-df-green"
                  : "bg-neutral-900/40 border-neutral-700 text-neutral-400"
              }
            `}
          >
            {data.hablaEspanol ? "✓ Hablo Español — VISIBLE" : "Add 'Hablo Español' line"}
          </button>
        </Field>
      </Section>

      {/* ============= CONTACT INFO ============= */}
      <Section title="Contact">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cell">
            <input
              type="text"
              value={data.cell}
              onChange={(e) => update("cell", e.target.value)}
              className={inputClass}
              placeholder="720-457-3788"
            />
          </Field>
          <Field label="Main">
            <input
              type="text"
              value={data.main}
              onChange={(e) => update("main", e.target.value)}
              className={inputClass}
              placeholder="877-779-9431"
            />
          </Field>
        </div>
        <Field label="Email">
          <input
            type="text"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
            placeholder="name@DiscountForklift.us"
          />
        </Field>
        <Field label="Website">
          <input
            type="text"
            value={data.website}
            onChange={(e) => update("website", e.target.value)}
            className={inputClass}
            placeholder="www.DiscountForklift.us"
          />
        </Field>
      </Section>

      {/* ============= LOCATION TOGGLE ============= */}
      <Section title="Location (Address shown on card)">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(LOCATIONS) as LocationKey[]).map((k) => {
            const isActive = data.location === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => update("location", k)}
                className={`
                  px-3 py-3 rounded-md text-left transition-all border-2
                  ${
                    isActive
                      ? "bg-df-red border-df-red text-white shadow-lg shadow-df-red/30"
                      : "bg-neutral-900/40 border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }
                `}
              >
                <div className="font-bold text-sm">{LOCATIONS[k].city}</div>
                <div className={`text-xs mt-0.5 ${isActive ? "text-white/80" : "text-neutral-500"}`}>
                  {LOCATIONS[k].address}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ============= GENERATE ============= */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate || generating}
        className="w-full py-5 bg-df-red hover:bg-df-red/90 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-white font-anton text-2xl tracking-widest rounded-md transition-all shadow-lg shadow-df-red/30 disabled:shadow-none"
      >
        {generating ? "GENERATING…" : "✨ GENERATE CARD"}
      </button>
      {!canGenerate && !generating && (
        <p className="text-xs text-neutral-500 text-center -mt-4">
          Upload both images, enter a name, and set the job title to enable.
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-neutral-900/60 border border-neutral-700 rounded-md px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-df-orange focus:ring-1 focus:ring-df-orange transition-colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-anton tracking-[0.25em] text-df-orange uppercase border-b border-neutral-800 pb-2">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`
        w-full flex items-start gap-3 p-3 rounded-md border-2 text-left transition-all
        ${
          checked
            ? "bg-df-orange/10 border-df-orange"
            : "bg-neutral-900/40 border-neutral-700 hover:border-neutral-500"
        }
      `}
    >
      <div
        className={`
          shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors
          ${checked ? "bg-df-orange border-df-orange" : "border-neutral-600"}
        `}
      >
        {checked && <span className="text-black text-xs font-bold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold ${checked ? "text-df-orange" : "text-neutral-300"}`}>
          {label}
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">{description}</div>
      </div>
    </button>
  );
}
