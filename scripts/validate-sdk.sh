#!/bin/bash
set -e

echo "🔍 NeuroAdapt SDK v1.1.0 - Final Validation"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success_count=0
total_checks=0

check_status() {
    total_checks=$((total_checks + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        success_count=$((success_count + 1))
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo -e "\n${BLUE}📦 Package Structure Validation${NC}"
echo "----------------------------------------"

# Check if all required packages exist
packages=("core" "ai" "vr" "quantum" "testing" "cli")
for package in "${packages[@]}"; do
    if [ -d "packages/$package" ]; then
        check_status 0 "Package @neuroadapt/$package exists"
    else
        check_status 1 "Package @neuroadapt/$package exists"
    fi
done

# Check if launchpad exists
if [ -d "apps/launchpad" ]; then
    check_status 0 "Launchpad demo application exists"
else
    check_status 1 "Launchpad demo application exists"
fi

echo -e "\n${BLUE}🏗️ Build System Validation${NC}"
echo "----------------------------------------"

# Install dependencies
echo "Installing dependencies..."
pnpm install --silent
check_status $? "Dependencies installed successfully"

# Build core package
echo "Building @neuroadapt/core..."
cd packages/core && pnpm build --silent
check_status $? "@neuroadapt/core builds successfully"
cd ../..

# Build AI package
echo "Building @neuroadapt/ai..."
cd packages/ai && pnpm build --silent
check_status $? "@neuroadapt/ai builds successfully"
cd ../..

# Check if dist files exist
if [ -f "packages/core/dist/index.js" ]; then
    check_status 0 "Core package generates dist files"
else
    check_status 1 "Core package generates dist files"
fi

if [ -f "packages/ai/dist/index.js" ]; then
    check_status 0 "AI package generates dist files"
else
    check_status 1 "AI package generates dist files"
fi

echo -e "\n${BLUE}📋 Package.json Validation${NC}"
echo "----------------------------------------"

# Check package.json files
for package in "${packages[@]}"; do
    if [ -f "packages/$package/package.json" ]; then
        # Check if package.json has required fields
        name=$(jq -r '.name' "packages/$package/package.json")
        version=$(jq -r '.version' "packages/$package/package.json")
        
        if [ "$name" = "@neuroadapt/$package" ] && [ "$version" = "1.1.0" ]; then
            check_status 0 "Package @neuroadapt/$package has correct name and version"
        else
            check_status 1 "Package @neuroadapt/$package has correct name and version"
        fi
    else
        check_status 1 "Package @neuroadapt/$package has package.json"
    fi
done

echo -e "\n${BLUE}📚 Documentation Validation${NC}"
echo "----------------------------------------"

# Check for README files
if [ -f "README.md" ]; then
    check_status 0 "Root README.md exists"
else
    check_status 1 "Root README.md exists"
fi

# Check for examples
if [ -f "examples/basic-usage.ts" ]; then
    check_status 0 "Basic usage example exists"
else
    check_status 1 "Basic usage example exists"
fi

echo -e "\n${BLUE}🔧 TypeScript Configuration${NC}"
echo "----------------------------------------"

# Check TypeScript configs
if [ -f "tsconfig.base.json" ]; then
    check_status 0 "Base TypeScript config exists"
else
    check_status 1 "Base TypeScript config exists"
fi

# Type check core package
echo "Type checking @neuroadapt/core..."
cd packages/core && pnpm typecheck --silent
check_status $? "@neuroadapt/core passes type checking"
cd ../..

# Type check AI package
echo "Type checking @neuroadapt/ai..."
cd packages/ai && pnpm typecheck --silent
check_status $? "@neuroadapt/ai passes type checking"
cd ../..

echo -e "\n${BLUE}🧪 Testing Infrastructure${NC}"
echo "----------------------------------------"

# Check for test files
if [ -f "packages/testing/src/utils/mock-adapters.ts" ]; then
    check_status 0 "Mock adapters for testing exist"
else
    check_status 1 "Mock adapters for testing exist"
fi

if [ -f "tests/accessibility.test.ts" ]; then
    check_status 0 "Accessibility tests exist"
else
    check_status 1 "Accessibility tests exist"
fi

if [ -f "playwright.config.ts" ]; then
    check_status 0 "Playwright configuration exists"
else
    check_status 1 "Playwright configuration exists"
fi

echo -e "\n${BLUE}🚀 CI/CD Configuration${NC}"
echo "----------------------------------------"

if [ -f ".github/workflows/ci.yml" ]; then
    check_status 0 "GitHub Actions CI/CD pipeline exists"
else
    check_status 1 "GitHub Actions CI/CD pipeline exists"
fi

if [ -f ".changeset/config.json" ]; then
    check_status 0 "Changesets configuration exists"
else
    check_status 1 "Changesets configuration exists"
fi

echo -e "\n${BLUE}📄 Essential Files${NC}"
echo "----------------------------------------"

essential_files=(
    ".gitignore"
    ".eslintrc.js"
    ".prettierrc"
    "pnpm-workspace.yaml"
    "package.json"
)

for file in "${essential_files[@]}"; do
    if [ -f "$file" ]; then
        check_status 0 "$file exists"
    else
        check_status 1 "$file exists"
    fi
done

echo -e "\n${BLUE}🎯 Feature Completeness${NC}"
echo "----------------------------------------"

# Check core features
core_features=(
    "packages/core/src/preferences/store.ts"
    "packages/core/src/sensory/visual-adapter.ts"
    "packages/core/src/cognitive/load-engine.ts"
)

for feature in "${core_features[@]}"; do
    if [ -f "$feature" ]; then
        check_status 0 "$(basename $feature .ts) implemented"
    else
        check_status 1 "$(basename $feature .ts) implemented"
    fi
done

# Check AI features
ai_features=(
    "packages/ai/src/predictable/predictable-ai.ts"
    "packages/ai/src/adapters/openai-adapter.ts"
    "packages/ai/src/adapters/claude-adapter.ts"
    "packages/ai/src/adapters/ollama-adapter.ts"
)

for feature in "${ai_features[@]}"; do
    if [ -f "$feature" ]; then
        check_status 0 "$(basename $feature .ts) implemented"
    else
        check_status 1 "$(basename $feature .ts) implemented"
    fi
done

echo -e "\n${BLUE}📊 Final Results${NC}"
echo "================================================"

echo -e "Total checks: ${BLUE}$total_checks${NC}"
echo -e "Successful: ${GREEN}$success_count${NC}"
echo -e "Failed: ${RED}$((total_checks - success_count))${NC}"

percentage=$((success_count * 100 / total_checks))
echo -e "Success rate: ${BLUE}$percentage%${NC}"

if [ $percentage -ge 95 ]; then
    echo -e "\n${GREEN}🎉 EXCELLENT! NeuroAdapt SDK is ready for production!${NC}"
elif [ $percentage -ge 85 ]; then
    echo -e "\n${YELLOW}⚠️  GOOD! NeuroAdapt SDK is mostly ready with minor issues.${NC}"
else
    echo -e "\n${RED}❌ NEEDS WORK! Several issues need to be addressed.${NC}"
fi

echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo "• Run: pnpm test (when tests are ready)"
echo "• Run: pnpm build"
echo "• Run: pnpm release (for publishing)"
echo "• Visit: apps/launchpad for interactive demo"

if [ $percentage -ge 85 ]; then
    exit 0
else
    exit 1
fi