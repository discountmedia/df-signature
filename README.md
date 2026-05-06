# Discount Forklift — Signature Card Generator (AI-Powered)

A Next.js + Gemini app that **clones an existing signature card and only swaps the photo + contact info**, using Google's Nano Banana 2 image-editing model. Designed to deploy on Vercel.

## How it works

This is an **image-editing app**, not a layout app. You give it two images and some form data; it gives you back a near-identical card with the changes applied.

```
Inputs:
  • Reference card (the existing template)
  • New employee headshot
  • Name, job title, contact info, address
  • Optional: smile enhancement, lighting enhancement
        ↓
Sent as multimodal prompt to
  gemini-3.1-flash-image-preview (Nano Banana 2)
        ↓
Returns: edited card image (ready to download)
```

## Features

| Feature | Notes |
| --- | --- |
| 🎨 **Pixel-perfect cloning via AI** | Gemini reproduces the entire reference card — fonts, logos, colors, backgrounds — and only changes what you tell it to. |
| 🏢 **Address toggle** | Denver · Phoenix · Las Vegas · DFW. The active city is bold-emphasized in the location strip on the card. |
| 🌐 **Hablo Español toggle** | Tells Gemini to keep or remove the Spanish line and close any gap left behind. |
| 😊 **Smile enhancement (optional)** | Toggle on to ask Gemini to give the new person a natural professional smile. |
| 💡 **Lighting enhancement (optional)** | Toggle on for studio-style even lighting on the headshot. |
| 🧑 **Headshot uploader (Field 1)** | The new employee's photo. |
| 🖼️ **Reference uploader (Field 2)** | The design template. Required. |
| 💾 **Browser memory** | Form state persists in `localStorage`; image data stays in-session. |
| ⬇️ **PNG download** | One click from the result panel. |

## Quick start

```bash
npm install
cp .env.example .env.local
# Add your key to .env.local — get one at https://aistudio.google.com/apikey
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

| Var | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | **Yes** | Used by the image-editing route. |
| `GEMINI_IMAGE_MODEL` | No | Override the model. Defaults to `gemini-3.1-flash-image-preview`. Use `gemini-3-pro-image-preview` for higher fidelity at higher cost. |

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add `GEMINI_API_KEY` under Project Settings → Environment Variables.
4. Deploy. The image route has `maxDuration = 60` to allow for Gemini's edit time.

## The prompt

Lives in `app/api/generate-card/route.ts` → `buildPrompt()`. It explicitly:

- Replaces the circular photo with the new headshot, matching crop and green ring.
- Updates each text field (name, title, cell, main, email, website, address) one by one.
- Adds or removes the Hablo Español line based on the toggle.
- Bolds the active city in the green location strip.
- **CRITICAL color rules** are called out under their own banner:
  - The heart on the forklift's forks must remain bright RED — never yellow.
  - Contact-block LABELS are cyan; VALUES are plain white text on black with no highlight, no background, no box, no underline.
- Optionally adjusts the headshot's expression (smile) and lighting if those toggles are on.
- Preserves everything else — banner, forklift+heart graphic, "Discount Forklift" script, "LIFT HERO" shield, "OCTANE FORKLIFTS" lockup, warehouse background — pixel-for-pixel.

Tune the prompt to taste; the model responds well to specific, declarative directives.

## Project structure

```
app/
  api/
    generate-card/route.ts   ← Gemini image-editing route (the brain)
  layout.tsx
  page.tsx                   ← UI: form on left, result on right
  globals.css
components/
  ControlPanel.tsx           ← Form controls + toggles + uploaders + Generate button
  ImageUploader.tsx          ← Used twice (headshot + reference)
lib/
  addresses.ts               ← The four locations
  types.ts                   ← EmployeeData type
```

## Cost notes

Each "Generate Card" click is one Nano Banana 2 image edit (small fraction of a cent at current pricing). Make sure billing is enabled on your AI Studio key.
