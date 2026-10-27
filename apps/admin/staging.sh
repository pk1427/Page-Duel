#!/usr/bin/env sh
# Start the Book People admin frontend against hosted Supabase staging.
#
# Admin's git-ignored .env.local already targets the hosted staging project.
# Exporting those vars first guarantees the web bundle points at
# https://idtukblrevdayhfjmetr.supabase.co. Shell env takes precedence over
# .env.local (see @expo/env), so this is reliable regardless of .env.local.
#
# Usage:
#   sh ./staging.sh                 # verify env + start Expo web on :8082
#   sh ./staging.sh --verify-only   # only verify env, do not start Expo
set -eu

ENV_FILE=".env.local"
PORT="8082"
VERIFY_ONLY="0"

while [ $# -gt 0 ]; do
  case "$1" in
    --verify-only) VERIFY_ONLY="1"; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ ! -f "./$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found." >&2
  exit 1
fi

# Export staging vars so they win over any conflicting shell/.env value.
set -a
. "./$ENV_FILE"
set +a

missing="0"
if [ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ]; then
  echo "ERROR: EXPO_PUBLIC_SUPABASE_URL is missing from $ENV_FILE" >&2
  missing="1"
fi
if [ -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  echo "ERROR: EXPO_PUBLIC_SUPABASE_ANON_KEY is missing from $ENV_FILE" >&2
  missing="1"
fi
if [ "$missing" = "1" ]; then
  exit 1
fi

echo "SUPABASE URL: $EXPO_PUBLIC_SUPABASE_URL"
echo "Supabase key: PRESENT"

if [ "$VERIFY_ONLY" = "1" ]; then
  exit 0
fi

echo "Starting Expo web on http://localhost:$PORT against hosted Supabase staging..."
expo start --web --port "$PORT" "$@"
