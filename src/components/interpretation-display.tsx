"use client";

import { InterpretationResult } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Languages, Lightbulb, MessageCircle, Smile } from "lucide-react";

interface Props {
  data: InterpretationResult;
}

export function InterpretationDisplay({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Header badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{data.detected_language}</Badge>
        <Badge variant="secondary">{data.tone}</Badge>
        {data.meme_format && (
          <Badge variant="secondary">{data.meme_format}</Badge>
        )}
        <Badge
          variant={
            data.confidence === "high"
              ? "default"
              : data.confidence === "medium"
                ? "secondary"
                : "destructive"
          }
        >
          Confidence: {data.confidence}
        </Badge>
      </div>

      {/* Translations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5" />
            Translations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Literal Translation
            </p>
            <p className="mt-1">{data.literal_translation}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Natural Translation
            </p>
            <p className="mt-1">{data.natural_translation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Meaning & Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5" />
            Meaning & Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Combined Meaning
            </p>
            <p className="mt-1">{data.combined_meaning}</p>
          </div>
          {data.context_explanation && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Context
                </p>
                <p className="mt-1">{data.context_explanation}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Slang */}
      {data.slang_explanation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              Slang Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{data.slang_explanation}</p>
          </CardContent>
        </Card>
      )}

      {/* Why it's funny */}
      {data.why_it_is_funny_or_relatable && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smile className="h-5 w-5" />
              Why It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{data.why_it_is_funny_or_relatable}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Vocabulary */}
      {data.key_vocabulary && data.key_vocabulary.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              Key Vocabulary
            </CardTitle>
            <CardDescription>Words worth learning from this reel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.key_vocabulary.map((vocab, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{vocab.word}</span>
                    <span className="text-sm text-muted-foreground">
                      — {vocab.meaning}
                    </span>
                  </div>
                  {vocab.notes && (
                    <p className="text-sm text-muted-foreground pl-2 border-l-2 border-muted">
                      {vocab.notes}
                    </p>
                  )}
                  {i < data.key_vocabulary.length - 1 && (
                    <Separator className="mt-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
