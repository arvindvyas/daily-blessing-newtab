#!/bin/bash
# Build the Firefox (AMO) package. Same code as Chrome; only the manifest differs.
# Output: ../daily-blessing-firefox.zip
set -e
cd "$(dirname "$0")"

TMP=$(mktemp -d)
cp manifest.firefox.json "$TMP/manifest.json"
cp newtab.html newtab.css newtab.js verses.js "$TMP/"
mkdir -p "$TMP/icons"
cp icons/icon16.png icons/icon48.png icons/icon128.png "$TMP/icons/"

OUT="$PWD/../daily-blessing-firefox.zip"
rm -f "$OUT"
( cd "$TMP" && zip -r "$OUT" . >/dev/null )
rm -rf "$TMP"
echo "Built $OUT"
unzip -l "$OUT"
