"use client";

import { useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, Upload, X, FileVideo } from "lucide-react";

type Mode = "video" | "text";

export function ReelForm() {
  const [mode, setMode] = useState<Mode>("video");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setError(null);
    }
  }

  function removeFile() {
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "video" && !videoFile) {
      setError("Please upload a video file.");
      return;
    }

    if (mode === "text" && !ocrText.trim() && !audioTranscript.trim()) {
      setError("Please provide at least one input.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: Response;

      if (mode === "video" && videoFile) {
        const formData = new FormData();
        formData.append("video", videoFile);
        res = await fetch("/api/interpret", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ocrText: ocrText.trim(),
            audioTranscript: audioTranscript.trim(),
          }),
        });
      }

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
          <CardTitle>Interpret a Reel</CardTitle>
          <CardDescription>
            Upload a screen recording of the reel, or paste the text manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mode toggle */}
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={mode === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("video")}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
            <Button
              type="button"
              variant={mode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("text")}
            >
              <Send className="mr-2 h-4 w-4" />
              Paste Text
            </Button>
          </div>

          <Separator className="mb-4" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "video" ? (
              <div className="space-y-2">
                <Label htmlFor="video">Reel Video</Label>
                {videoFile ? (
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <FileVideo className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {videoFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8" />
                    <p className="text-sm">
                      Click to upload a screen recording
                    </p>
                    <p className="text-xs">MP4, MOV, or WEBM</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  id="video"
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <>
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
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "video"
                    ? "Processing video..."
                    : "Interpreting..."}
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
