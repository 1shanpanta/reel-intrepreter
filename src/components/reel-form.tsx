"use client";

import { useState } from "react";
import { InterpretationResult } from "@/lib/types";
import { InterpretationDisplay } from "@/components/interpretation-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";

export function ReelForm() {
  const [ocrText, setOcrText] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!ocrText.trim() && !audioTranscript.trim()) {
      setError("Please provide at least one input.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ocrText: ocrText.trim(),
          audioTranscript: audioTranscript.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const data: InterpretationResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paste Reel Content</CardTitle>
          <CardDescription>
            Enter the text you see on screen (OCR) and/or the audio transcript
            from the reel. At least one is required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ocr">On-Screen Text (OCR)</Label>
              <Textarea
                id="ocr"
                placeholder="Paste the text visible in the reel..."
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio">Audio Transcript</Label>
              <Textarea
                id="audio"
                placeholder="Paste what was said in the reel..."
                value={audioTranscript}
                onChange={(e) => setAudioTranscript(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Interpreting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Interpret Reel
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && <InterpretationDisplay data={result} />}
    </div>
  );
}
