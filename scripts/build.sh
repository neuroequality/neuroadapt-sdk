#!/bin/bash
set -e

echo "🏗️  Building NeuroAdapt SDK packages..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build packages in dependency order
echo "🔧 Building @neuroadapt/core..."
cd packages/core
pnpm build
cd ../..

echo "🔧 Building @neuroadapt/ai..."
cd packages/ai
pnpm build
cd ../..

# TODO: Build other packages when implemented
# echo "🔧 Building @neuroadapt/vr..."
# cd packages/vr && pnpm build && cd ../..

# echo "🔧 Building @neuroadapt/quantum..."
# cd packages/quantum && pnpm build && cd ../..

# echo "🔧 Building @neuroadapt/testing..."
# cd packages/testing && pnpm build && cd ../..

# echo "🔧 Building @neuroadapt/cli..."
# cd packages/cli && pnpm build && cd ../..

echo "🚀 Building launchpad..."
cd apps/launchpad
pnpm build
cd ../..

echo "✅ Build complete!"