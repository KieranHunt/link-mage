#!/usr/bin/env bash
# Build the source-code zip for AMO review submission.
#
# AMO requires source code for any extension whose published files are
# transpiled or bundled (Bun bundles ours), and the reviewer must be able
# to reproduce dist/ from this archive following the README's build
# instructions.
#
# Includes everything needed to reproduce the .xpi; excludes generated
# output (dist/, web-ext-artifacts/) and dependencies (node_modules/).
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(jq -r .version public/manifest.json)
OUTPUT_DIR="web-ext-artifacts"
OUTPUT="$OUTPUT_DIR/link-mage-source-${VERSION}.zip"

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT"

zip -r "$OUTPUT" \
  src public scripts \
  package.json bun.lock mise.toml tsconfig.json \
  README.md LICENSE CONTEXT.md docs \
  -x "*.DS_Store" "*/.DS_Store"

echo "Wrote $OUTPUT"
