#!/usr/bin/env bash
set -u

STRICT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      STRICT=1
      shift
      ;;
    -h|--help)
      echo "Usage: preflight.sh [--strict]"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

PASS_COUNT=0
FAIL_COUNT=0
ROWS=()

add_row() {
  local check="$1" result="$2" detail="$3"
  if [[ "$result" == "PASS" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  ROWS+=("| $check | $result | $detail |")
}

has_cmd() { command -v "$1" >/dev/null 2>&1; }

VCS="none"
if has_cmd jj && jj root >/dev/null 2>&1; then
  VCS="jj"
  add_row "VCS detect" "PASS" "Detected jj"
elif has_cmd git && git rev-parse --show-toplevel >/dev/null 2>&1; then
  VCS="git"
  add_row "VCS detect" "PASS" "Detected git"
else
  add_row "VCS detect" "FAIL" "No repo detected"
fi

if [[ "$VCS" == "jj" ]]; then
  if [[ -z "$(jj diff --summary 2>/dev/null || true)" ]]; then
    add_row "Working state" "PASS" "jj working copy clean"
  else
    add_row "Working state" "PASS" "jj working copy has changes (allowed in main-workspace flow)"
  fi
elif [[ "$VCS" == "git" ]]; then
  STATUS="$(git status --porcelain 2>/dev/null || true)"
  TRACKED="$(printf "%s\n" "$STATUS" | grep -v '^??' || true)"
  if [[ -z "$TRACKED" ]]; then
    add_row "Working state" "PASS" "No tracked-file changes"
  else
    add_row "Working state" "FAIL" "Tracked files changed"
  fi
fi

if has_cmd gh; then
  if gh auth status >/dev/null 2>&1; then
    add_row "GitHub auth" "PASS" "gh authenticated"
  else
    add_row "GitHub auth" "FAIL" "gh not authenticated"
  fi
else
  add_row "GitHub auth" "FAIL" "gh missing"
fi

if has_cmd node; then add_row "Node" "PASS" "$(node --version 2>/dev/null)"; else add_row "Node" "FAIL" "node missing"; fi
if has_cmd npm; then add_row "npm" "PASS" "$(npm --version 2>/dev/null)"; else add_row "npm" "FAIL" "npm missing"; fi
if has_cmd ffmpeg; then add_row "ffmpeg" "PASS" "$(ffmpeg -version 2>/dev/null | head -n 1)"; else add_row "ffmpeg" "FAIL" "ffmpeg missing"; fi

echo "## Preflight Results"
echo ""
echo "| Check | Result | Details |"
echo "|---|---|---|"
for r in "${ROWS[@]}"; do
  echo "$r"
done

echo ""
if [[ $FAIL_COUNT -eq 0 ]]; then
  echo "**Gate:** GO"
else
  echo "**Gate:** NO-GO ($FAIL_COUNT failure(s))"
fi

echo "**Summary:** $PASS_COUNT passed, $FAIL_COUNT failed"

if [[ $STRICT -eq 1 && $FAIL_COUNT -gt 0 ]]; then
  exit 1
fi
