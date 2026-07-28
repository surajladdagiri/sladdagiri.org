#!/usr/bin/env bash
#
# upload.sh — push a prepared movie to R2.
#
#   ./upload.sh ./out [slug]
#
# Reads credentials from scripts/theater/.env (gitignored). Uses rclone when it's
# available because it does multipart with a progress bar and resumes a broken
# transfer; falls back to the aws CLI.
#
set -euo pipefail

DIR="${1:-./out}"
SLUG="${2:-$(jq -r '.title' "$DIR/manifest.json" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-')}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
[[ -f "$HERE/.env" ]] && source "$HERE/.env"

: "${R2_ACCOUNT_ID:?set in scripts/theater/.env}"
: "${R2_ACCESS_KEY_ID:?set in scripts/theater/.env}"
: "${R2_SECRET_ACCESS_KEY:?set in scripts/theater/.env}"
: "${R2_BUCKET:=theater}"

ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
echo "uploading $DIR -> r2://$R2_BUCKET/$SLUG/"

if command -v rclone >/dev/null; then
  export RCLONE_CONFIG_R2_TYPE=s3
  export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
  export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
  export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
  export RCLONE_CONFIG_R2_ENDPOINT="$ENDPOINT"
  export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

  rclone copy "$DIR" "r2:$R2_BUCKET/$SLUG" \
    --progress --transfers 4 --s3-chunk-size 64M --s3-upload-concurrency 4
elif command -v aws >/dev/null; then
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws s3 sync "$DIR" "s3://$R2_BUCKET/$SLUG/" \
    --endpoint-url "$ENDPOINT" --checksum-algorithm CRC32
else
  echo "need rclone (brew install rclone) or the aws CLI" >&2
  exit 1
fi

echo
echo "done. slug: $SLUG"
echo "set THEATER_SLUG=$SLUG in the Worker, or pass ?m=$SLUG in the URL."
