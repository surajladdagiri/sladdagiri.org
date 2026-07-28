#!/usr/bin/env bash
#
# prepare.sh — turn an MKV into something a browser can actually play.
#
#   ./prepare.sh /path/to/movie.mkv [outdir]
#
# Browsers do not play MKV reliably. Chrome plays *some* (H.264+AAC inside an
# MKV container); Safari plays none. And "high quality" rips are usually HEVC
# video with AC3/DTS/TrueHD audio, which no browser decodes at all.
#
# So we normalise to MP4 (H.264 + AAC + faststart). When the source is already
# H.264/AAC this is a *lossless remux* that takes about two minutes and touches
# not a single pixel. When it isn't, we transcode, which takes hours on CPU.
#
# Output:
#   <outdir>/movie.mp4        the video
#   <outdir>/sub.<lang>.vtt   one per text subtitle track
#   <outdir>/manifest.json    what the player reads
#
set -euo pipefail

SRC="${1:-}"
OUT="${2:-./out}"
CRF="${CRF:-18}"          # 18 is visually transparent. 20 for a smaller file.
PRESET="${PRESET:-slow}"
AAC_BITRATE="${AAC_BITRATE:-256k}"

if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "usage: $0 /path/to/movie.mkv [outdir]" >&2
  exit 1
fi

for bin in ffmpeg ffprobe jq; do
  command -v "$bin" >/dev/null || { echo "missing: $bin" >&2; exit 1; }
done

mkdir -p "$OUT"

probe() { ffprobe -v error -print_format json -show_streams -show_format "$SRC"; }
INFO="$(probe)"

VCODEC=$(jq -r '[.streams[]|select(.codec_type=="video")][0].codec_name // "none"' <<<"$INFO")
ACODEC=$(jq -r '[.streams[]|select(.codec_type=="audio")][0].codec_name // "none"' <<<"$INFO")
ACHAN=$( jq -r '[.streams[]|select(.codec_type=="audio")][0].channels  // 2'      <<<"$INFO")
WIDTH=$( jq -r '[.streams[]|select(.codec_type=="video")][0].width     // 0'      <<<"$INFO")
HEIGHT=$(jq -r '[.streams[]|select(.codec_type=="video")][0].height    // 0'      <<<"$INFO")
DUR=$(   jq -r '.format.duration // 0' <<<"$INFO")

echo "source : ${WIDTH}x${HEIGHT}  video=$VCODEC  audio=$ACODEC (${ACHAN}ch)  $(printf '%.0f' "$DUR")s"

# ---------------------------------------------------------------- video path
# H.264 is the only codec every browser decodes. HEVC plays in Safari and in
# Chrome on some hardware, but "some hardware" is not a plan when the whole
# point is that it works on her laptop without her thinking about it.
if [[ "$VCODEC" == "h264" ]]; then
  VARGS=(-c:v copy)
  echo "video  : copy (lossless remux)"
else
  VARGS=(-c:v libx264 -preset "$PRESET" -crf "$CRF" -pix_fmt yuv420p -profile:v high -level 4.1)
  echo "video  : TRANSCODE $VCODEC -> h264 crf=$CRF preset=$PRESET  (this will take hours)"
fi

# ---------------------------------------------------------------- audio path
# A 5.1 AC3 track downmixed by ffmpeg's default matrix buries the dialogue under
# the effects channel. The explicit pan below lifts centre (dialogue) and pulls
# the surrounds back, which is what you want on laptop speakers and headphones.
if [[ "$ACODEC" == "aac" && "$ACHAN" -le 2 ]]; then
  AARGS=(-c:a copy)
  echo "audio  : copy"
elif [[ "$ACHAN" -gt 2 ]]; then
  # Addressed by channel INDEX (c0, c1…) rather than by name (FL, BL…).
  #
  # Named channels break on real files: "5.1" means FL FR FC LFE BL BR, but
  # "5.1(side)" means FL FR FC LFE SL SR. A pan expression naming BL fails
  # outright on a side-layout track, and naming SL fails on a back-layout one.
  # The index order is identical in both, so c0..c5 works on either without
  # having to probe the layout first.
  #
  #   c0=FL  c1=FR  c2=FC(dialogue)  c3=LFE  c4=BL/SL  c5=BR/SR
  #
  # LFE (c3) is deliberately dropped — it's sub-80Hz content that laptop
  # speakers and earbuds can't reproduce anyway, and folding it into a stereo
  # mix just muddies everything above it.
  DOWNMIX="pan=stereo|c0=0.707*c0+0.5*c2+0.5*c4|c1=0.707*c1+0.5*c2+0.5*c5"
  if [[ "${LOUDNORM:-1}" == "1" ]]; then
    DOWNMIX="$DOWNMIX,loudnorm=I=-16:TP=-1.5:LRA=11"
  fi
  AARGS=(-c:a aac -b:a "$AAC_BITRATE" -ac 2 -af "$DOWNMIX")
  echo "audio  : downmix ${ACHAN}ch -> stereo aac ${AAC_BITRATE} (dialogue-weighted)"
  [[ "${LOUDNORM:-1}" == "1" ]] &&
    echo "         loudnorm on — set LOUDNORM=0 to keep the original dynamics"
else
  AARGS=(-c:a aac -b:a "$AAC_BITRATE")
  echo "audio  : $ACODEC -> aac ${AAC_BITRATE}"
fi

# ------------------------------------------------------------------ subtitles
# Text subs (subrip/ass) convert cleanly to WebVTT. Image subs (PGS, VOBSUB) are
# bitmaps — there is no text in them to convert, so they need OCR or burn-in.
# Most 1080p BluRay rips carry PGS, so this branch fires more often than you'd like.
SUBS_JSON="[]"
NSUB=$(jq -r '[.streams[]|select(.codec_type=="subtitle")]|length' <<<"$INFO")
echo "subs   : $NSUB track(s)"

for i in $(seq 0 $((NSUB - 1))); do
  [[ "$NSUB" -eq 0 ]] && break
  SCODEC=$(jq -r "[.streams[]|select(.codec_type==\"subtitle\")][$i].codec_name" <<<"$INFO")
  SLANG=$( jq -r "[.streams[]|select(.codec_type==\"subtitle\")][$i].tags.language // \"und\"" <<<"$INFO")
  STITLE=$(jq -r "[.streams[]|select(.codec_type==\"subtitle\")][$i].tags.title // \"\"" <<<"$INFO")
  LABEL="${STITLE:-$SLANG}"

  case "$SCODEC" in
    subrip|srt|ass|ssa|mov_text|webvtt|text)
      NAME="sub.${i}.${SLANG}.vtt"
      if ffmpeg -y -v error -i "$SRC" -map "0:s:$i" -c:s webvtt "$OUT/$NAME" 2>/dev/null; then
        echo "         [$i] $SCODEC ($LABEL) -> $NAME"
        SUBS_JSON=$(jq -c --arg s "$NAME" --arg l "$LABEL" --arg g "$SLANG" \
          '. + [{src:$s,label:$l,lang:$g}]' <<<"$SUBS_JSON")
      else
        echo "         [$i] $SCODEC ($LABEL) -> FAILED, skipped"
      fi
      ;;
    hdmv_pgs_subtitle|dvd_subtitle|dvb_subtitle)
      echo "         [$i] $SCODEC ($LABEL) -> IMAGE-BASED, cannot convert."
      echo "              These are bitmaps, not text. Two options:"
      echo "                a) OCR them:  pip install pgsrip && pgsrip '$SRC'"
      echo "                b) Grab a matching .srt from opensubtitles and place it"
      echo "                   in $OUT, then re-run with SKIP_VIDEO=1"
      ;;
    *) echo "         [$i] $SCODEC ($LABEL) -> unknown, skipped" ;;
  esac
done

# Any .srt you dropped in the output dir by hand gets picked up too.
shopt -s nullglob
for srt in "$OUT"/*.srt; do
  base="$(basename "${srt%.srt}")"
  ffmpeg -y -v error -i "$srt" "$OUT/sub.${base}.vtt"
  echo "         hand-supplied $base.srt -> sub.${base}.vtt"
  SUBS_JSON=$(jq -c --arg s "sub.${base}.vtt" --arg l "$base" \
    '. + [{src:$s,label:$l,lang:"und"}]' <<<"$SUBS_JSON")
done
shopt -u nullglob

# ---------------------------------------------------------------------- muxing
# -movflags +faststart relocates the moov atom to the front of the file. Without
# it the browser must download the entire file before it can render frame one,
# which defeats the whole exercise.
if [[ "${SKIP_VIDEO:-0}" != "1" ]]; then
  echo
  echo "muxing -> $OUT/movie.mp4"
  ffmpeg -y -stats -v warning -i "$SRC" \
    -map 0:v:0 -map 0:a:0 \
    "${VARGS[@]}" "${AARGS[@]}" \
    -movflags +faststart \
    -max_muxing_queue_size 4096 \
    "$OUT/movie.mp4"
fi

SIZE=$(stat -f%z "$OUT/movie.mp4" 2>/dev/null || stat -c%s "$OUT/movie.mp4")
SIZE_GB=$(echo "scale=2; $SIZE/1073741824" | bc)

jq -n --arg t "$(basename "${SRC%.*}")" --argjson d "$DUR" \
      --argjson subs "$SUBS_JSON" --argjson bytes "$SIZE" \
  '{title:$t, duration:$d, video:"movie.mp4", bytes:$bytes, subtitles:$subs}' \
  > "$OUT/manifest.json"

echo
echo "done. ${SIZE_GB} GB -> $OUT/"
# R2's free tier is 10 GB of storage. Egress is free and unmetered, so the only
# number that can cost you anything is this one.
if (( $(echo "$SIZE_GB > 10" | bc -l) )); then
  echo
  echo "  !! ${SIZE_GB} GB exceeds R2's 10 GB free storage tier."
  echo "     Overage is \$0.015/GB/month — about \$0.08/mo for a 15 GB file, so this"
  echo "     is a rounding error rather than a problem. But if you want strict zero:"
  echo "     re-run with CRF=20, or delete the file from R2 after you've watched it."
fi
echo "next:  ./upload.sh $OUT"
