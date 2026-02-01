#!/bin/bash

# Content Cartographer Demo Setup Script
# Creates a fresh Umbraco 17 instance with sample content

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="${SCRIPT_DIR}/demo_instance"

echo "🗺️  Content Cartographer Demo Setup"
echo "===================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK not found. Install from https://dotnet.microsoft.com/"
    exit 1
fi

dotnet_version=$(dotnet --version)
echo "✅ .NET SDK: $dotnet_version"

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found (optional, needed only for rebuilding)"
fi

# Create demo directory
echo ""
echo "📁 Creating demo instance..."
if [ -d "$DEMO_DIR" ]; then
    echo "⚠️  Demo directory already exists. Using existing: $DEMO_DIR"
else
    mkdir -p "$DEMO_DIR"
fi

cd "$DEMO_DIR"

# Create Umbraco project
if [ ! -f "UmbracoDemoCartographer/Program.cs" ]; then
    echo "🆕 Creating Umbraco 17 project..."
    dotnet new umbraco -n UmbracoDemoCartographer -o UmbracoDemoCartographer --release Latest --force
else
    echo "✅ Umbraco project already exists"
fi

cd UmbracoDemoCartographer

# Build Content Cartographer
echo ""
echo "🦀 Building Content Cartographer package..."
cd "$SCRIPT_DIR/packages/ContentCartographer.Core"
if [ ! -f "bin/Release/net10.0/Umbraco.Grail.ContentCartographer.dll" ]; then
    echo "   Running build.sh..."
    bash ./build.sh
else
    echo "   ✅ Package already built"
fi

# Copy package to demo instance
echo ""
echo "📦 Installing Content Cartographer into demo instance..."
mkdir -p "$DEMO_DIR/UmbracoDemoCartographer/bin"
cp -v bin/Release/net10.0/Umbraco.Grail.ContentCartographer.dll \
      "$DEMO_DIR/UmbracoDemoCartographer/bin/"

# Copy WASM artifacts
mkdir -p "$DEMO_DIR/UmbracoDemoCartographer/wwwroot/wasm"
cp -v wwwroot/wasm/* "$DEMO_DIR/UmbracoDemoCartographer/wwwroot/wasm/"

echo ""
echo "✅ Demo instance ready!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Start the demo instance:"
echo "   cd $DEMO_DIR/UmbracoDemoCartographer"
echo "   dotnet run"
echo ""
echo "2. Open in browser: http://localhost:5000"
echo ""
echo "3. Complete the Umbraco setup wizard"
echo "   - Database: SQLite (recommended)"
echo "   - Create superuser account"
echo ""
echo "4. Follow DEMO.md for creating sample content"
echo ""
echo "Happy exploring! 🗺️"
