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
MODE="${MODE:-auto}"              # auto | remux | h264
MAX_HEIGHT="${MAX_HEIGHT:-1080}"  # 4K sources come down to this. 2160 keeps 4K.
VBITRATE="${VBITRATE:-10M}"       # only used by the hardware encoder
HW="${HW:-1}"                     # 1 = use Apple VideoToolbox when available

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
# ------------------------------------------------------- audio track choice
#
# Taking audio stream 0 is wrong on any MULTi release: the first track is
# whichever language the packager put first, which for a French MULTi rip is
# French. Prefer a language tag instead, and fall back to the first track only
# when nothing matches.
AUDIO_LANG="${AUDIO_LANG:-eng}"
if [[ -n "${AUDIO_TRACK:-}" ]]; then
  AIDX="$AUDIO_TRACK"
else
  AIDX=$(jq -r --arg L "$AUDIO_LANG" \
    '[.streams[]|select(.codec_type=="audio")] | to_entries
     | (map(select(.value.tags.language==$L))[0].key) // 0' <<<"$INFO")
fi

ACODEC=$(jq -r "[.streams[]|select(.codec_type==\"audio\")][$AIDX].codec_name // \"none\"" <<<"$INFO")
ACHAN=$( jq -r "[.streams[]|select(.codec_type==\"audio\")][$AIDX].channels  // 2"      <<<"$INFO")
WIDTH=$( jq -r '[.streams[]|select(.codec_type=="video")][0].width     // 0'      <<<"$INFO")
HEIGHT=$(jq -r '[.streams[]|select(.codec_type=="video")][0].height    // 0'      <<<"$INFO")
PIXFMT=$(jq -r '[.streams[]|select(.codec_type=="video")][0].pix_fmt   // ""'     <<<"$INFO")
TRC=$(   jq -r '[.streams[]|select(.codec_type=="video")][0].color_transfer // ""' <<<"$INFO")
DUR=$(   jq -r '.format.duration // 0' <<<"$INFO")

echo "source : ${WIDTH}x${HEIGHT}  video=$VCODEC  audio=$ACODEC (${ACHAN}ch)  $(printf '%.0f' "$DUR")s"

# ---------------------------------------------------------------- video path
# H.264 is the only codec every browser decodes. HEVC plays in Safari and in
# Chrome on some hardware, but "some hardware" is not a plan when the whole
# point is that it works on her laptop without her thinking about it.
IS_HDR=0;  case "$TRC"    in smpte2084|arib-std-b67)   IS_HDR=1  ;; esac
IS_DEEP=0; case "$PIXFMT" in *10le|*10be|*12le|*12be) IS_DEEP=1 ;; esac

# Constrain BOTH dimensions, not just height.
#
# A 2.40:1 scope film is something like 3840x2074, so capping only the height
# yields 2000x1080 — wider than 1080p and needlessly large. Capping both and
# letting the aspect ratio decide gives 1920x1037, which is what you want.
MAX_WIDTH=$(( MAX_HEIGHT * 16 / 9 ))
NEEDS_SCALE=0
[[ "$HEIGHT" -gt "$MAX_HEIGHT" || "$WIDTH" -gt "$MAX_WIDTH" ]] && NEEDS_SCALE=1

# Which tone-mapping backend does this ffmpeg actually have?
#
# libplacebo is preferred: one filter, GPU-accelerated, better algorithms.
# zscale+tonemap is the widely-available fallback. Plenty of ffmpeg builds ship
# with neither — notably some Homebrew bottles — so this is checked rather than
# assumed, because the alternative is discovering it after the probe output has
# already scrolled past and ffmpeg dies with "No such filter".
FILTERS="$(ffmpeg -hide_banner -filters 2>/dev/null || true)"
TONEMAP_BACKEND="none"
grep -q " zscale "     <<<"$FILTERS" && TONEMAP_BACKEND="zscale"
grep -q " libplacebo " <<<"$FILTERS" && TONEMAP_BACKEND="libplacebo"

if [[ "$MODE" == "remux" ]]; then
  # Keep the video bitstream exactly as-is — 4K, HDR, 10-bit, all of it — and
  # only change the container. Minutes instead of hours, zero quality loss.
  #
  # The cost is compatibility. HEVC in MP4 plays in Safari and in Chrome on
  # Apple silicon, but not in Chrome on most Windows machines and not in
  # Firefox. HDR will only look right on an HDR-capable display; on an SDR
  # screen the browser does its own rough tone-mapping, which is usually
  # acceptable but is out of our hands.
  VARGS=(-c:v copy)
  if [[ "$VCODEC" == "hevc" ]]; then
    # Without the hvc1 tag, ffmpeg writes hev1 and Safari/QuickTime silently
    # refuse to play the file. This single flag is the difference between
    # "works" and "black screen with audio".
    VARGS+=(-tag:v hvc1)
  fi
  echo "video  : COPY $VCODEC ${WIDTH}x${HEIGHT}$([[ $IS_HDR -eq 1 ]] && echo ' HDR') untouched  (MODE=remux)"
  echo "         no scaling, no tone-mapping, no re-encode — container change only"
  echo "         !! plays in Safari + Chrome-on-Apple-silicon. Test in BOTH of your"
  echo "            browsers on a short sample before trusting it for a whole film."

elif [[ "$VCODEC" == "h264" && $IS_HDR -eq 0 && $IS_DEEP -eq 0 && $NEEDS_SCALE -eq 0 ]]; then
  VARGS=(-c:v copy)
  echo "video  : copy (lossless remux)"
else
  # Filter ORDER is the single biggest lever on how long this takes.
  #
  # Tone-mapping cost is per-pixel, so doing it at 2160p costs four times what
  # it costs at 1080p. Measured on a 4K HDR sample, tonemap-then-scale was over
  # 1.5x slower than scale-then-tonemap and didn't even finish in the time the
  # other one took. Scaling in PQ space first is marginally less correct in
  # theory and invisible in practice — worth hours of your evening.
  VF=""
  if [[ $NEEDS_SCALE -eq 1 ]]; then
    VF="scale=w=min(iw\,$MAX_WIDTH):h=min(ih\,$MAX_HEIGHT):force_original_aspect_ratio=decrease:force_divisible_by=2"
  fi

  if [[ $IS_HDR -eq 1 ]]; then
    # Without this, PQ-encoded HDR gets reinterpreted as if it were SDR gamma
    # and comes out flat, grey and washed out. This converts to linear light,
    # compresses 1000+ nit highlights into SDR range, and retags as bt709.
    case "$TONEMAP_BACKEND" in
      libplacebo)
        VF="${VF:+$VF,}libplacebo=tonemapping=bt.2390:colorspace=bt709:color_primaries=bt709:color_trc=bt709:format=yuv420p"
        ;;
      zscale)
        VF="${VF:+$VF,}zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709"
        VF="$VF,tonemap=tonemap=${TONEMAP_ALGO:-hable}:desat=0"
        VF="$VF,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
        ;;
      none)
        cat >&2 <<'EOF'

  !! This is HDR, but your ffmpeg has neither zscale nor libplacebo, so it
     cannot be tone-mapped. Converting anyway would produce a flat, grey,
     washed-out picture — so this stops here instead of wasting your time.

     Fix (macOS):   brew reinstall ffmpeg
                    ffmpeg -filters | grep zscale     # confirm it's there now

     If brew's build still lacks it:
                    brew tap homebrew-ffmpeg/ffmpeg
                    brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-zimg

     To convert anyway and accept the washed-out look:
                    ALLOW_NO_TONEMAP=1 ./prepare.sh ...

EOF
        if [[ "${ALLOW_NO_TONEMAP:-0}" != "1" ]]; then exit 1; fi
        echo "         proceeding WITHOUT tone-mapping — expect a grey picture" >&2
        VF="${VF:+$VF,}format=yuv420p"
        ;;
    esac
  else
    # Browsers don't decode H.264 High 10, so anything deeper than 8 bits has
    # to come down whether or not it's HDR.
    VF="${VF:+$VF,}format=yuv420p"
  fi

  # Apple's hardware encoder is roughly an order of magnitude faster than x264
  # for this. Quality per bit is worse, which is why it runs at a fixed high
  # bitrate rather than pretending to be CRF — at 10 Mbps for 1080p that
  # difference isn't visible on a laptop.
  if [[ "$HW" == "1" ]] && ffmpeg -hide_banner -encoders 2>/dev/null | grep -q h264_videotoolbox; then
    VARGS=(-vf "$VF" -c:v h264_videotoolbox -b:v "$VBITRATE" -profile:v high)
    ENC="h264_videotoolbox (Apple hardware) @ $VBITRATE"
  else
    VARGS=(-vf "$VF" -c:v libx264 -preset "$PRESET" -crf "$CRF" -profile:v high -level 4.1)
    ENC="libx264 crf=$CRF preset=$PRESET (software — slow)"
  fi

  echo "video  : TRANSCODE $VCODEC ${WIDTH}x${HEIGHT}$([[ $IS_HDR -eq 1 ]] && echo ' HDR')$([[ $IS_DEEP -eq 1 ]] && echo ' 10-bit')"
  echo "         -> $ENC"
  [[ $NEEDS_SCALE -eq 1 ]] && echo "         scaling to fit ${MAX_WIDTH}x${MAX_HEIGHT}  (MAX_HEIGHT=2160 keeps 4K)"
  [[ $IS_HDR -eq 1 ]]      && echo "         tone-mapping HDR -> SDR via $TONEMAP_BACKEND (after scaling, so it runs at ${MAX_HEIGHT}p)"
fi

# ---------------------------------------------------------------- audio path
# A 5.1 AC3 track downmixed by ffmpeg's default matrix buries the dialogue under
# the effects channel. The explicit pan below lifts centre (dialogue) and pulls
# the surrounds back, which is what you want on laptop speakers and headphones.
# Show every track and mark the chosen one, so a wrong pick is visible here
# rather than forty minutes into a film.
NAUD=$(jq -r '[.streams[]|select(.codec_type=="audio")]|length' <<<"$INFO")
if [[ "$NAUD" -gt 1 ]]; then
  echo "audio  : $NAUD tracks available"
  for ai in $(seq 0 $((NAUD - 1))); do
    al=$( jq -r "[.streams[]|select(.codec_type==\"audio\")][$ai].tags.language // \"und\"" <<<"$INFO")
    aco=$(jq -r "[.streams[]|select(.codec_type==\"audio\")][$ai].codec_name"              <<<"$INFO")
    ach=$(jq -r "[.streams[]|select(.codec_type==\"audio\")][$ai].channels // 2"           <<<"$INFO")
    ati=$(jq -r "[.streams[]|select(.codec_type==\"audio\")][$ai].tags.title // \"\""      <<<"$INFO")
    mark="   "; [[ "$ai" == "$AIDX" ]] && mark=" ->"
    echo "        $mark [$ai] $al $aco ${ach}ch $ati"
  done
  echo "         (wrong one? AUDIO_LANG=fre or AUDIO_TRACK=1 to override)"
fi

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
  # Predict the output size before spending an hour producing it. Only the
  # hardware encoder has a fixed bitrate to predict from; x264's CRF is
  # content-dependent, so no estimate is offered there rather than a wrong one.
  if [[ "${ENC:-}" == h264_videotoolbox* ]]; then
    VB_NUM=$(echo "$VBITRATE" | sed 's/[Mm]$//')
    EST_GB=$(echo "scale=1; ($VB_NUM * 1000000 + 256000) * $DUR / 8 / 1073741824" | bc)
    echo
    echo "estimate: ~${EST_GB} GB output (${VBITRATE} video for $(printf '%.0f' "$DUR")s)"
    if (( $(echo "$EST_GB > 9.5" | bc -l) )); then
      echo "  !! That's at or over R2's 10 GB free tier. For a feature-length film,"
      echo "     VBITRATE=6M is still very good at 1080p and lands near $(echo "scale=1; (6000000+256000)*$DUR/8/1073741824" | bc) GB."
      echo "     Ctrl-C now and re-run with VBITRATE=6M if you'd rather."
      sleep 5
    fi
  fi

  echo
  echo "muxing -> $OUT/movie.mp4"
  ffmpeg -y -stats -v warning -i "$SRC" \
    -map 0:v:0 -map "0:a:$AIDX" \
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
