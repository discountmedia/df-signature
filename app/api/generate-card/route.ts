import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RequestBody {
  referenceDataUrl: string;
  headshotDataUrl: string;
  name: string;
  title: string;
  hablaEspanol: boolean;
  smileEnhancement: boolean;
  lightingEnhancement: boolean;
  cell: string;
  main: string;
  email: string;
  website: string;
  address: string;
  activeCity: string;
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL");
  return { mimeType: match[1], data: match[2] };
}

function buildPrompt(b: RequestBody): string {
  const spanishDirective = b.hablaEspanol
    ? `KEEP the "Hablo Español" line directly beneath the title. Preserve the same styling as in the reference card.`
    : `REMOVE the "Hablo Español" line entirely. Close the vertical gap so the title sits directly above the city list with natural spacing — do not leave a blank gap.`;

  const smileDirective = b.smileEnhancement
    ? `\n   ADDITIONALLY: Adjust the person's expression to show a natural, warm, professional smile — closed-mouth or slight teeth, believable and friendly, never exaggerated. Preserve the person's identity, facial features, and skin tone exactly.`
    : "";

  const lightingDirective = b.lightingEnhancement
    ? `\n   ADDITIONALLY: Improve the lighting on the person's face to look like a professional studio headshot — even, clean, balanced light with no harsh shadows. Keep the original skin tone and facial features intact.`
    : "";

  return `You are reproducing an existing employee signature card. Two images are attached:

[IMAGE 1] = the EXISTING SIGNATURE CARD (master template — the source of truth for ALL styling).
[IMAGE 2] = the NEW EMPLOYEE HEADSHOT.

GOAL: Output a new version of [IMAGE 1] that is visually IDENTICAL to it except for the specific changes listed below. Treat this like a flawless reproduction job. Every visual property — fonts, colors, weights, sizes, alignment, positioning, spacing, backgrounds, logos, graphics, drop shadows, photographic effects — must be preserved EXACTLY as it appears in the reference card. The reference card is the absolute source of truth for all styling. Do not invent colors. Do not change any color you are not explicitly instructed to change.

THE ONLY CHANGES YOU MAY MAKE:

1. PHOTO REPLACEMENT
   Replace the circular employee photo with the person from [IMAGE 2]. Match the original's circular crop, the ring border, the exact pixel position, and the same scale. The new face should sit naturally inside the existing photo frame as if it were always there. Do not change the ring, do not move the photo, do not resize the circle.${smileDirective}${lightingDirective}

2. TEXT VALUE UPDATES — preserve every visual property of each text field exactly as it appears in the reference (color, font family, weight, size, alignment, letter-spacing, position, drop shadows, etc.). Only change the WORDS:
   • Employee name → "${b.name}"
   • Title line → "${b.title}"
   • Spanish line → ${spanishDirective}
   • Cell number → "${b.cell}"
   • Main number → "${b.main}"
   • Email address → "${b.email}"
   • Website → "${b.website}"
   • Address line → "${b.address}"

3. CITY STRIP EMPHASIS
   In the city list ("Denver - Las Vegas - Phoenix - DFW"), make "${b.activeCity}" the visually emphasized one (bold, matching how the reference card emphasizes its currently-active city). All four cities remain present, in the same order.

═══════════════════════════════════════════════════════════════
PRESERVE EVERYTHING ELSE EXACTLY AS IT APPEARS IN THE REFERENCE
═══════════════════════════════════════════════════════════════

Every pixel of the reference card that is not explicitly listed above as a "change" must look IDENTICAL in the output. This includes — but is not limited to:

- The banner at the top of the card and its text
- The small forklift graphic in the top-left and the heart it carries — preserve the heart's exact shape, position, and color from the reference. Do not change the heart's color under any circumstances.
- The tagline beneath the banner
- The photographic background behind the photo and name
- The script logo beneath the photo (its exact color, outline, and styling)
- The shield wordmark in the bottom-left
- The wordmark in the bottom-right
- All field labels — preserve their EXACT color, weight, and style as they appear in the reference. Do not change any label color.
- All padding, margins, alignment, spacing, and overall layout
- The aspect ratio (output should match [IMAGE 1] exactly — approximately 1000 × 838 pixels)

ABSOLUTELY DO NOT:
- Invent new colors not present in the reference
- Add highlight boxes, pill backgrounds, shaded rectangles, or colored fills behind any text
- Tint, shade, or recolor any text
- Add underlines or borders that aren't in the reference
- Add watermarks or captions
- Add any new graphic elements
- Crop, rotate, or reframe the image

Output ONLY the finished signature card image with the listed changes applied. Pixel-perfect reproduction of every other element is the highest priority.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;

    if (!body.referenceDataUrl || !body.headshotDataUrl) {
      return NextResponse.json(
        { error: "Both 'referenceDataUrl' and 'headshotDataUrl' are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set. Add it to .env.local or your Vercel env vars." },
        { status: 500 }
      );
    }

    const reference = parseDataUrl(body.referenceDataUrl);
    const headshot = parseDataUrl(body.headshotDataUrl);
    const prompt = buildPrompt(body);

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image-preview";

    const response = await ai.models.generateContent({
      model,
      contents: [
        { text: prompt },
        { inlineData: { mimeType: reference.mimeType, data: reference.data } },
        { inlineData: { mimeType: headshot.mimeType, data: headshot.data } },
      ],
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    let imageDataUrl: string | null = null;
    let textNotes = "";

    for (const part of parts) {
      const inline =
        (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData ??
        (part as { inline_data?: { mime_type?: string; data?: string } }).inline_data;

      if (inline?.data) {
        const mt =
          (inline as { mimeType?: string }).mimeType ??
          (inline as { mime_type?: string }).mime_type ??
          "image/png";
        imageDataUrl = `data:${mt};base64,${inline.data}`;
        break;
      }
      if ("text" in part && typeof part.text === "string") {
        textNotes += part.text;
      }
    }

    if (!imageDataUrl) {
      return NextResponse.json(
        {
          error:
            "Gemini did not return an image. The model may have refused the edit. Notes: " +
            (textNotes || "(none)"),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageDataUrl, notes: textNotes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 500 });
  }
}
