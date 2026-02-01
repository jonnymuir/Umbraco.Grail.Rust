#!/bin/bash
# Development server for Content Cartographer

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🗺️  Starting Content Cartographer development server..."

# Navigate to package directory first
cd "$SCRIPT_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build WASM for development
echo "🦀 Building Rust WASM..."
cd "$PROJECT_ROOT/engine/grail_core"
wasm-pack build --target web

# Copy WASM artifacts into package wwwroot for Vite to serve
echo "📋 Copying WASM artifacts to package wwwroot..."
WASM_OUTPUT="$PROJECT_ROOT/engine/grail_core/pkg"
WASM_DIST="$SCRIPT_DIR/wwwroot/wasm"
mkdir -p "$WASM_DIST"
cp "$WASM_OUTPUT"/*.wasm "$WASM_DIST/" 2>/dev/null || true
cp "$WASM_OUTPUT"/*.js "$WASM_DIST/" 2>/dev/null || true
cp "$WASM_OUTPUT"/*.d.ts "$WASM_DIST/" 2>/dev/null || true

# Return to package and start dev server
cd "$SCRIPT_DIR"
echo "🚀 Starting Vite dev server..."
# If a process is listening on default port, kill it so we can restart cleanly
PORT=5173
PID=$(lsof -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$PID" ]; then
	echo "🔁 Found existing process listening on port $PORT (PID=$PID). Killing..."
	kill "$PID" || true
	sleep 0.5
fi

npm run dev
