# Content Cartographer Demo Setup Script (PowerShell)
# Creates a fresh Umbraco 17 instance with sample content

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$demoDir = Join-Path $scriptDir "demo_instance"

Write-Host "🗺️  Content Cartographer Demo Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

try {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET SDK: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ .NET SDK not found. Install from https://dotnet.microsoft.com/" -ForegroundColor Red
    exit 1
}

# Create demo directory
Write-Host ""
Write-Host "📁 Creating demo instance..." -ForegroundColor Yellow

if (-not (Test-Path $demoDir)) {
    New-Item -ItemType Directory -Path $demoDir -Force | Out-Null
    Write-Host "✅ Created: $demoDir" -ForegroundColor Green
} else {
    Write-Host "✅ Using existing: $demoDir" -ForegroundColor Green
}

Push-Location $demoDir

# Create Umbraco project
if (-not (Test-Path "UmbracoDemoCartographer\Program.cs")) {
    Write-Host "🆕 Creating Umbraco 17 project..." -ForegroundColor Yellow
    dotnet new umbraco -n UmbracoDemoCartographer -o UmbracoDemoCartographer --release Latest --force
} else {
    Write-Host "✅ Umbraco project already exists" -ForegroundColor Green
}

# Build Content Cartographer
Write-Host ""
Write-Host "🦀 Building Content Cartographer package..." -ForegroundColor Yellow

Push-Location (Join-Path $scriptDir "packages\ContentCartographer.Core")

$dllPath = "bin\Release\net10.0\Umbraco.Grail.ContentCartographer.dll"
if (-not (Test-Path $dllPath)) {
    Write-Host "   Running build.sh..." -ForegroundColor Yellow
    bash build.sh
} else {
    Write-Host "   ✅ Package already built" -ForegroundColor Green
}

# Copy package to demo instance
Write-Host ""
Write-Host "📦 Installing Content Cartographer into demo instance..." -ForegroundColor Yellow

$demoInstance = Join-Path $demoDir "UmbracoDemoCartographer"
$binDir = Join-Path $demoInstance "bin"
$wasmDir = Join-Path $demoInstance "wwwroot\wasm"

Copy-Item $dllPath -Destination $binDir -Force -Verbose
New-Item -ItemType Directory -Path $wasmDir -Force | Out-Null
Copy-Item "wwwroot\wasm\*" -Destination $wasmDir -Force -Verbose

Pop-Location  # Back from ContentCartographer.Core
Pop-Location  # Back from demo_instance

Write-Host ""
Write-Host "✅ Demo instance ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the demo instance:" -ForegroundColor White
Write-Host "   cd $demoInstance" -ForegroundColor Gray
Write-Host "   dotnet run" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open in browser: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "3. Complete the Umbraco setup wizard" -ForegroundColor White
Write-Host "   - Database: SQLite (recommended)" -ForegroundColor Gray
Write-Host "   - Create superuser account" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Follow DEMO.md for creating sample content" -ForegroundColor White
Write-Host ""
Write-Host "Happy exploring! 🗺️" -ForegroundColor Cyan
