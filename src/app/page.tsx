import { ReelForm } from "@/components/reel-form";
import { Languages } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Languages className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">
              Reel Interpreter
            </h1>
          </div>
          <p className="text-muted-foreground">
            Understand French Instagram Reels &amp; TikToks — slang, humor, and
            all.
          </p>
        </header>

        <ReelForm />
      </div>
    </div>
  );
}
