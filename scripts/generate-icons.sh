#!/usr/bin/env bash
# Regenerate the link-mage toolbar and listing icons on macOS.
#
# The mage comes from a supplied PNG (Apple's 🧙 emoji exported to a file); the
# success/failure badges are drawn with Apple Color Emoji. Rendering is done by
# scripts/generate-icons.swift via Swift + AppKit, so no extra tooling is
# needed beyond the Xcode command line tools.
#
# Produces:
#   icons/icon-default.png      48x48   (toolbar default + manifest icons[48])
#   icons/icon-default-96.png   96x96   (manifest icons[96])
#   icons/icon-default-128.png  128x128 (manifest icons[128]; AMO listing icon)
#   icons/icon-active.png       48x48   (toolbar success flash: mage + ✅)
#   icons/icon-fail.png         48x48   (toolbar failure flash: mage + ❌)
set -euo pipefail

cd "$(dirname "$0")/.."

ICONS_DIR="public/icons"
# Source mage PNG; override with LINK_MAGE_MAGE_SRC to swap in a new artwork.
MAGE_SRC="${LINK_MAGE_MAGE_SRC:-assets/mage-source.png}"
mkdir -p "$ICONS_DIR"

if [[ ! -f "$MAGE_SRC" ]]; then
  echo "error: mage source not found: $MAGE_SRC" >&2
  exit 1
fi

swift scripts/generate-icons.swift "$MAGE_SRC" "$ICONS_DIR"

echo "Generated from $MAGE_SRC:"
echo "  $ICONS_DIR/icon-default.png      (48x48)"
echo "  $ICONS_DIR/icon-default-96.png   (96x96)"
echo "  $ICONS_DIR/icon-default-128.png  (128x128)"
echo "  $ICONS_DIR/icon-active.png       (48x48)"
echo "  $ICONS_DIR/icon-fail.png         (48x48)"
