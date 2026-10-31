#!/usr/bin/env bash
#
# Package the Oxygen publishing template, with the quiz script inside it, as a
# zip a content author can download and use without a command line
# (SRD 013, owner decision: authors cannot run npm).
#
# Builds the obfuscated-storage bundle, copies it into dita/template/resources,
# and writes dist/oxygen-template-<version>.zip containing:
#   template/                      the publishing template (point Oxygen at template/f13ldMan-CSA.opt)
#   generate-password-hash.html    makes the qd-instructor-hash value
#   README.md                      the author instructions (dita/README.md)
#
# Usage: npm run package:template [-- <version>]
set -euo pipefail

cd "$(dirname "$0")/.."
VERSION="${1:-$(node -p "require('./package.json').version")}"
OUT="dist/oxygen-template-${VERSION}.zip"

npm run build:encrypted
cp dist/sonar-quiz.iife.js dist/sonar-quiz.iife.js.map dita/template/resources/

rm -f "$OUT"
(cd dita && zip -qr "../${OUT}" template generate-password-hash.html README.md -x 'template/.*')

# The zip must carry the script, or the template does nothing
unzip -l "$OUT" | grep -q 'template/resources/sonar-quiz.iife.js' || {
  echo "❌ ${OUT} is missing template/resources/sonar-quiz.iife.js" >&2
  exit 1
}
echo "✅ ${OUT}"
