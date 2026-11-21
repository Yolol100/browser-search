#!/usr/bin/env bash
# Start the private MCP browser after GitHub Codespaces starts.
# GitHub Codespaces is the only supported automatic-start environment.
set -euo pipefail

if [[ "$(printenv CODESPACES 2>/dev/null || true)" != "true" ]]; then
  printf 'No Codespace detected: private browser auto-start skipped.\n'
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="$ROOT/cloud-browser"
HOST="127.0.0.1"
PORT="8765"
HEALTH_URL="http://$HOST:$PORT/health"

if [[ ! -f "$PROJECT/node_modules/playwright/package.json" ]]; then
  printf 'Browser dependencies missing. Run cd cloud-browser && npm install.\n' >&2
  exit 1
fi

# A Codespace port must remain private. Never listen on public interfaces.
export BROWSER_BIND="$HOST"
export PORT="$PORT"

if curl --fail --silent --max-time 2 "$HEALTH_URL" | grep -Fq '"private":true'; then
  printf 'Private browser already listening on %s; no duplicate launched.\n' "$HEALTH_URL"
  exit 0
fi

umask 077
LOG_DIR="$HOME/.cache/webactueel-private-browser"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/server.log"
PID_FILE="$LOG_DIR/server.pid"

(
  cd "$PROJECT"
  nohup node src/server.mjs > "$LOG_FILE" 2>&1 < /dev/null &
  printf '%s\n' "$!" > "$PID_FILE"
)

PID="$(cat "$PID_FILE")"
for attempt in $(seq 1 40); do
  if curl --fail --silent --max-time 1 "$HEALTH_URL" | grep -Fq '"private":true'; then
    printf 'Private Codespaces browser ready: %s\n' "$HEALTH_URL"
    printf 'MCP endpoint (inside Codespace only): http://%s:%s/mcp\n' "$HOST" "$PORT"
    printf 'Security: port 8765 must remain PRIVATE in the Codespaces Ports tab.\n'
    exit 0
  fi
  if ! kill -0 "$PID" 2>/dev/null; then
    printf 'Browser exited before readiness. Inspect the private log within Codespaces.\n' >&2
    exit 1
  fi
  sleep 0.25
done

printf 'Browser did not become ready. Inspect private log inside Codespaces.\n' >&2
exit 1
