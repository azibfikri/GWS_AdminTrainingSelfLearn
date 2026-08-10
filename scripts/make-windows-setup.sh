#!/bin/zsh
# Build a friend-ready Windows Setup zip (works from Apple Silicon Mac).
# Produces: dist/GWS-Admin-Study-Desk-<version>-Windows-Setup.zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./package.json').version")"
OUT_NAME="GWS-Admin-Study-Desk-${VERSION}-Windows-Setup"
STAGE="$ROOT/dist/.win-setup-stage"
FINAL_ZIP="$ROOT/dist/${OUT_NAME}.zip"

echo "→ Building Windows x64 unpack + zip…"
npx electron-builder --win zip --x64 --publish never

echo "→ Staging Setup package…"
rm -rf "$STAGE"
mkdir -p "$STAGE/$OUT_NAME"
# Prefer unpacked tree (complete), fall back to unzipping builder zip
if [[ -d "$ROOT/dist/win-unpacked" ]]; then
  ditto "$ROOT/dist/win-unpacked" "$STAGE/$OUT_NAME"
else
  ditto -x -k "$ROOT/dist/GWS Admin Study Desk-${VERSION}-Windows-x64.zip" "$STAGE/$OUT_NAME"
fi

cp "$ROOT/scripts/windows/Install.bat" "$STAGE/$OUT_NAME/"
cp "$ROOT/scripts/windows/Uninstall.bat" "$STAGE/$OUT_NAME/"
cp "$ROOT/scripts/windows/README-WINDOWS.txt" "$STAGE/$OUT_NAME/"

rm -f "$FINAL_ZIP"
# zip from inside stage so archive root is the app folder
(
  cd "$STAGE"
  zip -ry "$FINAL_ZIP" "$OUT_NAME"
)

rm -rf "$STAGE"
SIZE="$(du -h "$FINAL_ZIP" | awk '{print $1}')"
echo ""
echo "✓ Ready to share:"
echo "  $FINAL_ZIP"
echo "  size: $SIZE"
echo ""
echo "Friend steps: unzip → Install.bat → Run anyway if SmartScreen warns."
