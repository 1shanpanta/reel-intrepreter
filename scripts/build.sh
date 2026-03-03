#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$ROOT/reel-interpreter.zip"

rm -f "$OUTPUT"

cd "$ROOT"
zip -r "$OUTPUT" \
  manifest.json \
  background.js \
  popup.html \
  popup.js \
  popup.css \
  icons/

echo "Built $OUTPUT"
