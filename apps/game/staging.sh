#!/usr/bin/env sh
# Start the Book People player frontend against hosted Supabase staging.
#
# Loads the git-ignored .env.staging.local (hosted URL + anon key). Because
# Expo otherwise loads .env.local in development mode. Disable that loader for
# this child process so only this staging file can determine the client bundle.
#
# Usage:
#   sh ./staging.sh                 # verify env + start Expo web on :8081
#   sh ./staging.sh --verify-only   # only verify env, do not start Expo
set -eu

ENV_FILE=".env.staging.local"
PORT="8081"
VERIFY_ONLY="0"

while [ $# -gt 0 ]; do
  case "$1" in
    --verify-only) VERIFY_ONLY="1"; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ ! -f "./$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.staging.example to .env.staging.local and fill in values." >&2
  exit 1
fi

# Do not inherit a developer's local/previous Expo values. This staging command
# must derive its client configuration only from the staging file.
unset EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY
unset EXPO_PUBLIC_STAGING_SUPABASE_URL EXPO_PUBLIC_STAGING_SUPABASE_ANON_KEY
unset EXPO_PUBLIC_STAGING_BOOK_ASSET_BASE_URL
unset EXPO_PUBLIC_STAGING_BOOK_ASSET_BASE_URL_ALICE_LOC_1885
unset EXPO_PUBLIC_STAGING_BOOK_ASSET_BASE_URL_TALES_OF_PUNJAB_1894

# Export staging vars so they win over .env.local (which holds the local URL).
set -a
. "./$ENV_FILE"

# Earlier staging setup used Next.js-style names. Support them only as a
# compatibility input, then expose the Expo names used by this application.
if [ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ] && [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  EXPO_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
fi
if [ -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" ] && [ -n "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}" ]; then
  EXPO_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
fi
EXPO_NO_DOTENV=1
EXPO_PUBLIC_STAGING_MODE=true
# Keep staging values in names that .env.local does not define. This protects a
# staging bundle even if a CLI/plugin attempts to load local dotenv values.
EXPO_PUBLIC_STAGING_SUPABASE_URL="$EXPO_PUBLIC_SUPABASE_URL"
EXPO_PUBLIC_STAGING_SUPABASE_ANON_KEY="$EXPO_PUBLIC_SUPABASE_ANON_KEY"
EXPO_PUBLIC_STAGING_BOOK_ASSET_BASE_URL="${EXPO_PUBLIC_BOOK_ASSET_BASE_URL:-}"
EXPO_PUBLIC_STAGING_BOOK_ASSET_BASE_URL_ALICE_LOC_1885="${EXPO_PUBLIC_BOOK_ASSET_BASE_URL_ALICE_LOC_1885:-}"
EXPO_PUBLIC_STAGING_BOOK_ASSET_BASE_URL_TALES_OF_PUNJAB_1894="${EXPO_PUBLIC_BOOK_ASSET_BASE_URL_TALES_OF_PUNJAB_1894:-}"
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
for asset_name in \
  EXPO_PUBLIC_STAGING_BOOK_ASSET_BASE_URL_ALICE_LOC_1885 \
  EXPO_PUBLIC_STAGING_BOOK_ASSET_BASE_URL_TALES_OF_PUNJAB_1894
do
  eval "asset_value=\${$asset_name:-}"
  if [ -z "$asset_value" ]; then
    echo "ERROR: $asset_name is missing from $ENV_FILE" >&2
    missing="1"
  elif [ "${asset_value#https://}" = "$asset_value" ]; then
    echo "ERROR: $asset_name must use an HTTPS hosted asset URL" >&2
    missing="1"
  fi
done
if [ "$missing" = "1" ]; then
  exit 1
fi

staging_host="${EXPO_PUBLIC_SUPABASE_URL#https://}"
staging_host="${staging_host#http://}"
staging_host="${staging_host%%/*}"
if [ "$staging_host" != "idtukblrevdayhfjmetr.supabase.co" ]; then
  echo "ERROR: staging URL host must be idtukblrevdayhfjmetr.supabase.co; got $staging_host" >&2
  exit 1
fi

echo "Supabase host: $staging_host"
echo "Supabase key: PRESENT"

if [ "$VERIFY_ONLY" = "1" ]; then
  exit 0
fi

echo "Starting Expo web on http://localhost:$PORT against hosted Supabase staging (no local Supabase)..."
# Environment variables are inlined into Metro transforms; clear the cache so a
# previous local-development bundle can never retain its local Supabase URL.
./node_modules/.bin/expo start --web --clear --port "$PORT" "$@"
