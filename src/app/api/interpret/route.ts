import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const contentType = request.headers.get("content-type") || "";

    let contents;

    if (contentType.includes("multipart/form-data")) {
      // Video upload flow
      const formData = await request.formData();
      const file = formData.get("video") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No video file provided" },
          { status: 400 }
        );
      }

      // Save to temp file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tempPath = join(tmpdir(), `reel-${Date.now()}-${file.name}`);
      await writeFile(tempPath, buffer);

      try {
        // Upload to Gemini File API
        const uploaded = await ai.files.upload({
          file: tempPath,
          config: { mimeType: file.type || "video/mp4" },
        });

        // Wait for processing
        let fileState = uploaded;
        while (fileState.state === "PROCESSING") {
          await new Promise((r) => setTimeout(r, 2000));
          fileState = await ai.files.get({ name: fileState.name! });
        }

        if (fileState.state === "FAILED") {
          throw new Error("Gemini failed to process the video file");
        }

        contents = createUserContent([
          createPartFromUri(fileState.uri!, fileState.mimeType!),
          "Analyze this reel video. Extract all on-screen text and spoken audio, then interpret it.",
        ]);
      } finally {
        await unlink(tempPath).catch(() => {});
      }
    } else {
      // Manual text input flow
      const { ocrText, audioTranscript } = await request.json();

      if (!ocrText && !audioTranscript) {
        return NextResponse.json(
          { error: "At least one of OCR text or audio transcript is required" },
          { status: 400 }
        );
      }

      contents = `OCR_TEXT:\n"""\n${ocrText || "(none provided)"}\n"""\n\nAUDIO_TRANSCRIPT:\n"""\n${audioTranscript || "(none provided)"}\n"""`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: { systemInstruction: SYSTEM_PROMPT },
      contents,
    });

    const responseText = response.text ?? "";

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
