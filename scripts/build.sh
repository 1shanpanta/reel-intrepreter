#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(grep '"version"' "$ROOT/manifest.json" | sed 's/.*: *"\(.*\)".*/\1/')
OUTPUT="$ROOT/reel-interpreter-v${VERSION}.zip"

rm -f "$OUTPUT"

cd "$ROOT"
zip -r "$OUTPUT" \
  manifest.json \
  background.js \
  popup.html \
  popup.js \
  popup.css \
  offscreen.html \
  offscreen.js \
  icons/

echo "Built $OUTPUT"
