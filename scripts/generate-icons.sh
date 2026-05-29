#!/usr/bin/env bash
# Regenerate the link-mage toolbar and listing icons from emoji.
# Requires ImageMagick 7+ with pangocairo and a color emoji font.
#
# Produces:
#   icons/icon-default.png      48x48  (toolbar default + manifest icons[48])
#   icons/icon-default-96.png   96x96  (manifest icons[96])
#   icons/icon-default-128.png  128x128 (manifest icons[128]; AMO listing icon)
#   icons/icon-active.png       48x48  (toolbar success flash)
#   icons/icon-fail.png         48x48  (toolbar failure flash)
set -euo pipefail

cd "$(dirname "$0")/.."

ICONS_DIR="public/icons"
EMOJI_FONT="${LINK_MAGE_EMOJI_FONT:-Apple Color Emoji}"
mkdir -p "$ICONS_DIR"

# Render an emoji onto a transparent canvas at the requested size.
# Args: <emoji> <size> <output-path>
render_emoji() {
  local emoji="$1"
  local size="$2"
  local output="$3"
  # Pango font size of ~0.75 * target gives consistent visual weight across
  # sizes; the extent crop centers the glyph in a square canvas.
  local font_size=$(( size * 3 / 4 ))
  magick -background none \
    pango:'<span font="'"$EMOJI_FONT"' '"$font_size"'">'"$emoji"'</span>' \
    -resize "${size}x${size}" -gravity center -extent "${size}x${size}" \
    "$output"
}

# Default mage icon at 48 (toolbar), 96, 128 (AMO listing).
render_emoji "🧙" 48  "$ICONS_DIR/icon-default.png"
render_emoji "🧙" 96  "$ICONS_DIR/icon-default-96.png"
render_emoji "🧙" 128 "$ICONS_DIR/icon-default-128.png"

# Active and fail flash icons live only in the toolbar (48x48 is enough);
# composed by overlaying a status badge in the bottom-right corner of the
# 48px default.
TMP_CHECK="$(mktemp --suffix=.png)"
TMP_CROSS="$(mktemp --suffix=.png)"
trap 'rm -f "$TMP_CHECK" "$TMP_CROSS"' EXIT

render_emoji "✅" 22 "$TMP_CHECK"
render_emoji "❌" 22 "$TMP_CROSS"

magick "$ICONS_DIR/icon-default.png" "$TMP_CHECK" \
  -gravity southeast -geometry +0+0 -composite \
  "$ICONS_DIR/icon-active.png"

magick "$ICONS_DIR/icon-default.png" "$TMP_CROSS" \
  -gravity southeast -geometry +0+0 -composite \
  "$ICONS_DIR/icon-fail.png"

echo "Generated:"
echo "  $ICONS_DIR/icon-default.png      (48x48)"
echo "  $ICONS_DIR/icon-default-96.png   (96x96)"
echo "  $ICONS_DIR/icon-default-128.png  (128x128)"
echo "  $ICONS_DIR/icon-active.png       (48x48)"
echo "  $ICONS_DIR/icon-fail.png         (48x48)"
