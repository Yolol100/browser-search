#!/usr/bin/env bash
# Stop only the previously started private browser process.
set -euo pipefail
PID_FILE="$HOME/.cache/webactueel-private-browser/server.pid"
if [[ ! -f "$PID_FILE" ]]; then
  printf 'No managed private browser PID file.\n'
  exit 0
fi

PID="$(cat "$PID_FILE")"
if [[ ! "$PID" =~ ^[0-9]+$ ]]; then
  printf 'Refusing unexpected PID data.\n' >&2
  exit 1
fi
if ! kill -0 "$PID" 2>/dev/null; then
  rm -f "$PID_FILE"
  printf 'Private browser already stopped.\n'
  exit 0
fi

# Never signal another process if a stale PID was reused.
PROCESS_COMMAND="$(ps -p "$PID" -o args= || true)"
if [[ "$PROCESS_COMMAND" != *"node src/server.mjs"* ]]; then
  printf 'Refusing to stop an unrelated process.\n' >&2
  exit 1
fi

kill -TERM "$PID"
rm -f "$PID_FILE"
printf 'Sent SIGTERM to managed private browser.\n'
