#!/bin/bash
# Build script for Content Cartographer
# Compiles Rust to WASM and prepares the package for distribution

set -e

echo "🗺️  Building Content Cartographer..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUST_PROJECT="$PROJECT_ROOT/engine/grail_core"
PACKAGE_DIR="$SCRIPT_DIR"

echo "📦 Project root: $PROJECT_ROOT"
echo "🦀 Rust project: $RUST_PROJECT"

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "⚠️  wasm-pack not found. Installing..."
    curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh
fi

# Build WASM
echo "🔨 Building WASM..."
cd "$RUST_PROJECT"
wasm-pack build --target web --release

# Copy WASM artifacts to package
echo "📋 Copying WASM artifacts..."
WASM_OUTPUT="$RUST_PROJECT/pkg"
WASM_DIST="$PACKAGE_DIR/wwwroot/wasm"

mkdir -p "$WASM_DIST"
cp "$WASM_OUTPUT"/*.wasm "$WASM_DIST/" 2>/dev/null || true
cp "$WASM_OUTPUT"/*.js "$WASM_DIST/" 2>/dev/null || true
cp "$WASM_OUTPUT"/*.d.ts "$WASM_DIST/" 2>/dev/null || true

# Build C# package
echo "🔨 Building C# package..."
cd "$PACKAGE_DIR"
dotnet build -c Release

# Copy compiled assemblies to appropriate location
echo "📋 Preparing package artifacts..."
mkdir -p "bin/Release/net6.0"

echo "✅ Build complete!"
echo ""
echo "📝 Generated artifacts:"
echo "   - WASM: $WASM_DIST"
echo "   - C# Assembly: $PACKAGE_DIR/bin/Release/net6.0"
