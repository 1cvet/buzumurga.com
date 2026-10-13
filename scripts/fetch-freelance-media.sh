#!/usr/bin/env bash
# Downloads the covers and screen recordings used on /freelance/ into static/assets/.
# Sources: the old Extra Flow site (xfluxdev.com) and the Cardinals site.
# Run once from the repository root, before xfluxdev.com is switched off:
#   bash scripts/fetch-freelance-media.sh
# Safe to run again: files that already exist are skipped.
# If ffmpeg is installed, covers are converted to JPEG (max 1200 px wide); otherwise kept as is.
set -euo pipefail
cd "$(dirname "$0")/.."

XF="https://xfluxdev.com/wp-content/uploads"
IMG="static/assets/img/work"
VID="static/assets/video"
mkdir -p "$IMG" "$VID"
fail=0

fetch() { # url dest
    if [ -s "$2" ]; then echo "skip  $2"; return 0; fi
    if curl -fsSL --retry 2 -o "$2.part" "$1"; then mv "$2.part" "$2"; echo "ok    $2"; else rm -f "$2.part"; echo "FAIL  $1"; fail=1; fi
}

cover() { # url name
    local url="$1" name="$2" ext="${1##*.}"
    for e in webp jpg png; do [ -s "$IMG/$name.$e" ] && { echo "skip  $IMG/$name.$e"; return 0; }; done
    local tmp="$IMG/.$name.src.$ext"
    fetch "$url" "$tmp" || true
    [ -s "$tmp" ] || return 0
    if command -v ffmpeg >/dev/null 2>&1; then
        ffmpeg -loglevel error -y -i "$tmp" -vf "scale='min(1200,iw)':-2" -q:v 3 "$IMG/$name.jpg" && rm -f "$tmp" && echo "jpg   $IMG/$name.jpg"
    else
        mv "$tmp" "$IMG/$name.$ext"
    fi
}

cover "https://cardinals.law/assets/og/og-home-en.png" cardinals
cover "$XF/2024/07/cake.png"                           christicrazycake
cover "$XF/2022/08/prodaykv1.jpg"                      prodaykv23

for f in prodaykv2 prodaykv3 myidem-kalendar-2 myidem-kalendar-3 myidem-prajs-list \
         nar-lounge-2 nar-lounge-3 paradise-cloud-2 paradise-cloud-3 misha-cvet-2; do
    fetch "$XF/2022/08/$f.mp4" "$VID/$f.mp4"
done

du -sh "$IMG" "$VID"
if [ "$fail" -ne 0 ]; then echo "Some downloads failed, see FAIL lines above." >&2; exit 1; fi
echo "Done. Now: node build.mjs && npm run check"
