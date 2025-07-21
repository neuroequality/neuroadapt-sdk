# Publishing NeuroAdapt SDK to NPM

## Prerequisites

1. NPM account with publish permissions
2. Two-factor authentication enabled
3. npm CLI logged in

## Quick Publishing Steps

### 1. Login to NPM

```bash
npm login
# Enter your username, password, and 2FA code
```

### 2. Verify Build Status

```bash
# Build packages that are ready
cd packages/core && pnpm build
cd ../vr && pnpm build  
cd ../quantum && pnpm build
cd ../testing && pnpm build
```

### 3. Publish Core Package (Ready)

```bash
cd packages/core
npm publish --access public
```

### 4. Publish VR Package (Ready)

```bash
cd packages/vr
npm publish --access public
```

### 5. Publish Quantum Package (Ready)

```bash
cd packages/quantum
npm publish --access public
```

### 6. Publish Testing Package (Ready)

```bash
cd packages/testing
npm publish --access public
```

## Packages Status

### ✅ Ready for Publishing

- **@neuroadapt/core** - Core preference management (build successful)
- **@neuroadapt/vr** - VR safe spaces (build successful)
- **@neuroadapt/quantum** - Quantum visualization (build successful)  
- **@neuroadapt/testing** - Mock adapters (build successful)

### ⚠️ Needs TypeScript Fixes

- **@neuroadapt/ai** - AI prediction engine (type errors)
- **@neuroadapt/cli** - CLI tools (missing dependencies)

## Alternative: Publish All at Once

You can use changesets to publish multiple packages:

```bash
# From project root
npm login
pnpm changeset
pnpm changeset version
pnpm build
pnpm changeset publish
```

## Post-Publishing Verification

After publishing, verify the packages:

```bash
npm view @neuroadapt/core
npm view @neuroadapt/vr
npm view @neuroadapt/quantum
npm view @neuroadapt/testing
```

## Installation Test

Test the published packages:

```bash
# Create test directory
mkdir neuroadapt-test && cd neuroadapt-test
npm init -y

# Install published packages
npm install @neuroadapt/core @neuroadapt/vr @neuroadapt/quantum @neuroadapt/testing

# Test basic import
node -e "console.log(require('@neuroadapt/core'))"
```

## Package Information

### @neuroadapt/core v1.1.0
- **Size**: ~8kb gzipped
- **Dependencies**: eventemitter3, zod
- **Exports**: PreferenceStore, VisualAdapter, CognitiveLoadEngine

### @neuroadapt/vr v1.1.0  
- **Size**: ~2.5kb gzipped
- **Dependencies**: @neuroadapt/core, eventemitter3
- **Exports**: SafeZoneManager

### @neuroadapt/quantum v1.1.0
- **Size**: ~4.7kb gzipped
- **Dependencies**: @neuroadapt/core, eventemitter3
- **Exports**: BlochSphereRenderer

### @neuroadapt/testing v1.1.0
- **Size**: ~2.9kb gzipped  
- **Dependencies**: @neuroadapt/core
- **Exports**: MockAIAdapter, MockPreferenceStorage

## Troubleshooting

### "Package name already exists"
The packages are scoped to `@neuroadapt/` so they should be available.

### "Authentication required"
Run `npm login` and ensure 2FA is working.

### "Version already published"
Update version in package.json if needed.

## Next Steps After Publishing

1. Update main README with installation instructions
2. Create GitHub releases for each package
3. Add npm badges to documentation  
4. Set up automated publishing via GitHub Actions
5. Monitor download stats and issues

## Package URLs (After Publishing)

- [@neuroadapt/core](https://www.npmjs.com/package/@neuroadapt/core)
- [@neuroadapt/vr](https://www.npmjs.com/package/@neuroadapt/vr)
- [@neuroadapt/quantum](https://www.npmjs.com/package/@neuroadapt/quantum)
- [@neuroadapt/testing](https://www.npmjs.com/package/@neuroadapt/testing)