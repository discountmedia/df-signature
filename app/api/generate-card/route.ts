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
  biggerSmile: boolean;
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
    ? `Add a single line of text directly beneath the job title. The line must read EXACTLY these two specific Spanish words and nothing else: "Hablo Espanol" (the second word "Espanol" must be rendered with a tilde mark above the letter n, displaying as the proper Spanish word for "Spanish"). This is a fixed standard Spanish phrase meaning "I speak Spanish" - it MUST be these two specific words. Do NOT invent, hallucinate, or substitute any other Spanish text or variations. Do NOT generate Spanish-sounding nonsense words. The output must contain the literal text "Hablo Espanol" (with proper Spanish tilde on the n in the second word) and nothing else on this line. Match the font family, size, color, weight, and alignment of the job title line directly above it.`
    : `Do not include a "Hablo Espanol" line. Do not include any other Spanish-language indicator line. Close the vertical gap so the job title sits directly above the city list with natural spacing.`;

  const smileDirective = b.biggerSmile
    ? `\n   ADDITIONALLY: Adjust the person's expression to show a HUGE, EAR-TO-EAR, JOYFUL GRIN - wide-open mouth with full upper teeth fully visible, eyes warmly and noticeably crinkled, the kind of unrestrained, energetic, contagious smile you would see in a candid celebration photo. Go big - this should read as exuberant and unmistakable, not subtle. Preserve the person's identity, facial features, skin tone, and overall face shape exactly - only the expression changes.`
    : b.smileEnhancement
    ? `\n   ADDITIONALLY: Adjust the person's expression to show a LARGE, GENUINE, BEAMING smile - teeth clearly visible, eyes warm and slightly crinkled, the kind of confident, happy smile you would see in a top-tier corporate headshot. The smile should be unmistakably big and friendly, not a closed-mouth smirk. Preserve the person's identity, facial features, skin tone, and overall face shape exactly - only the expression changes.`
    : "";

  const lightingDirective = b.lightingEnhancement
    ? `\n   ADDITIONALLY: Improve the lighting on the person's face to look like a professional studio headshot - even, clean, balanced light with no harsh shadows. Keep the original skin tone and facial features intact.`
    : "";

  return `You are reproducing an existing employee signature card. Two images are attached:

[IMAGE 1] = the EXISTING SIGNATURE CARD (master template - the source of truth for ALL styling).
[IMAGE 2] = the NEW EMPLOYEE HEADSHOT.

GOAL: Output a new version of [IMAGE 1] that is visually IDENTICAL to it except for the specific changes listed below. Treat this like a flawless reproduction job. Every visual property - fonts, colors, weights, sizes, alignment, positioning, spacing, backgrounds, logos, graphics, drop shadows, photographic effects - must be preserved EXACTLY as it appears in the reference card. Do not invent colors. Do not change any color you are not explicitly instructed to change.

THE ONLY CHANGES YOU MAY MAKE:

1. PHOTO REPLACEMENT
   Replace the circular employee photo with the person from [IMAGE 2]. Match the original's circular crop, the ring border, the exact pixel position, and the same scale. The new face should sit naturally inside the existing photo frame as if it were always there. Do not change the ring, do not move the photo, do not resize the circle.${smileDirective}${lightingDirective}

2. TEXT VALUE UPDATES - preserve every visual property of each text field exactly as it appears in the reference (color, font family, weight, size, alignment, letter-spacing, position, drop shadows). Only change the WORDS:
   * Employee name -> "${b.name}"
   * Title line -> "${b.title}"
   * Spanish line -> ${spanishDirective}
   * Cell number -> "${b.cell}"
   * Main number -> "${b.main}"
   * Email address -> "${b.email}"
   * Website -> "${b.website}"
   * Address line -> "${b.address}"

3. CITY STRIP EMPHASIS
   In the city list (Denver - Las Vegas - Phoenix - DFW), make "${b.activeCity}" the visually emphasized one (bold, matching how the reference card emphasizes its currently-active city). All four cities remain present, in the same order.

PRESERVE EVERYTHING ELSE EXACTLY AS IT APPEARS IN THE REFERENCE.

Every pixel of the reference card that is not explicitly listed above as a "change" must look IDENTICAL in the output. This includes:

- The banner at the top of the card and its text
- The small forklift graphic in the top-left and the heart it carries - preserve the heart's exact shape, position, and color from the reference. Do not change the heart's color under any circumstances.
- The tagline beneath the banner
- The photographic background behind the photo and name
- The script logo beneath the photo (its exact color, outline, and styling)
- The shield wordmark in the bottom-left
- The wordmark in the bottom-right
- All field labels - preserve their EXACT color, weight, and style as they appear in the reference
- All padding, margins, alignment, spacing, and overall layout
- The aspect ratio (output should match [IMAGE 1] exactly - approximately 1000 x 838 pixels)

ABSOLUTELY DO NOT:
- Invent new colors not present in the reference
- Add highlight boxes, pill backgrounds, shaded rectangles, or colored fills behind any text
- Tint, shade, or recolor any text
- Add underlines or borders that aren't in the reference
- Add watermarks or captions
- Add any new graphic elements
- Crop, rotate, or reframe the image
- Generate or hallucinate Spanish words other than the exact phrase specified above

Output ONLY the finished signature card image with the listed changes applied.`;
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
            "Gemini did not return an image. Notes: " +
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