#!/bin/zsh

set -euo pipefail

SRC_DIR="public/images/rsvp"
OUT_DIR="public/images/rsvp-optimized"
MAX_DIMENSION=800
JPEG_QUALITY=60

mkdir -p "$OUT_DIR"

count=0
for src in "$SRC_DIR"/*.jpg; do
  [[ -f "$src" ]] || continue
  filename=${src:t}
  dest="$OUT_DIR/$filename"
  cp "$src" "$dest"
  sips -Z "$MAX_DIMENSION" --setProperty formatOptions "$JPEG_QUALITY" "$dest" >/dev/null
  ((count += 1))
done

echo "Optimized $count RSVP backdrop images into $OUT_DIR"
