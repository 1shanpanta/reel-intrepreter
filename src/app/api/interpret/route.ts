import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const { ocrText, audioTranscript } = await request.json();

    if (!ocrText && !audioTranscript) {
      return NextResponse.json(
        { error: "At least one of OCR text or audio transcript is required" },
        { status: 400 }
      );
    }

    const userPayload = `OCR_TEXT:\n"""\n${ocrText || "(none provided)"}\n"""\n\nAUDIO_TRANSCRIPT:\n"""\n${audioTranscript || "(none provided)"}\n"""`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userPayload);
    const responseText = result.response.text();

    // Strip markdown code fences if present
    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Interpretation error:", error);
    return NextResponse.json(
      { error: "Failed to interpret the reel content" },
      { status: 500 }
    );
  }
}
