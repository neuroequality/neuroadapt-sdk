# NeuroAdapt SDK Completion (v1.1 Release Target) Master Prompt

## 0. Context Snapshot
You have a monorepo **`neuroadapt-sdk`** with packages:
- `@neuroadapt/core` (sensory, cognitive, preferences – partial)
- `@neuroadapt/ai` (Claude/OpenAI/Ollama + function calling – partial)
- `@neuroadapt/vr` (comfort & motion placeholders)
- `@neuroadapt/quantum` (simple visualizer + circuit builder)
- `@neuroadapt/testing` (basic test suite + Playwright a11y placeholder)
- `@neuroadapt/cli` (create-app scaffold)
- `website` (Next.js Launchpad with preferences UI, demos, docs ingestion)

Recent enhancements: sensory DOM adapters, cognitive heuristics (basic), OpenAI function calling adapter, preferences persistence in Launchpad.

## 1. Objective
Deliver **v1.1** as a minimally production-viable, documented, test-covered, performance & accessibility focused SDK enabling adaptive neurodiversity features across Web, AI, (first usable slice of) VR, and quantum visualization.

## 2. Non-Negotiable Constraints
- **Languages:** TypeScript (core), minimal C# (Unity bridge placeholder), optional Python stub generation deferred.
- **Runtime Targets:** Node 18+ / Browser (ES2020), local Ollama (optional), Anthropic & OpenAI APIs.
- **Security & Privacy:** No PII persistence; preferences stored local-first; no outbound telemetry without explicit opt-in flag.
- **Quality Gates:** Lint (ESLint), type-check (TS strict), unit test coverage ≥80% lines / 70% branches for core & ai, Playwright a11y CI passes (WCAG AA baseline via axe).
- **Style:** Existing ESLint + Prettier; no disabled rules unless justified in code comments.
- **Documentation:** TypeDoc generated API + written guides; Launchpad dynamic docs must render all `.md` in `/docs`.

## 3. Weighted Prioritization Formula
Use matrix: **Value (40%) + Feasibility (30%) + Time-to-Market (20%) + Strategic (10%)**. Implement highest composites first via *vertical slices* (feature fully working across stack: core logic → adapter → examples → docs → tests).

## 4. High-Level Deliverables
| Slice | Goal | Accepts When |
|-------|------|--------------|
| Adaptive Preferences Engine | Validated schema + merge, profile import/export, local persistence, event hooks | CRUD & events tested; invalid schemas rejected |
| Sensory DOM Adaptation (Phase 1) | Real motion/animation reduction, contrast themes, font scaling, color vision filters | Demo toggles in Launchpad update app DOM; tests snapshot CSS transforms |
| Cognitive Load Engine (Phase 2) | Heuristics: interaction cadence, reading time estimate, overload states, mitigation strategies | Simulated tests trigger load tiers; adaptation logs emitted |
| AI Predictable Layer | Normalization pipeline, chunking, explanation stratification, rate limiting & retry, tool-call orchestrator, streaming | All functions exposed & documented; example shows streaming & tool results |
| Claude/OpenAI/Ollama Adapters | Unified interface with consistent error object, abort signals, caching, seeded determinism simulation | Unified `AIAdapter` tests pass; offline fallback for local models |
| VR Slice (WebXR + API Design) | Implement *non-Unity* WebXR comfort zone (radius detection stub), reduced motion, safe space overlay | Mock XR scene test passes; Launchpad doc page updated |
| Quantum Visualization v1 | Real Bloch sphere (Three.js) + amplitude→color mapping + phase→hue + simple analogies | Example renders sphere; unit test verifies mapping function |
| Testing Suite | Jest coverage, Playwright a11y for Launchpad core pages, profile simulation harness | CI green; coverage thresholds met |
| Launchpad Enhancements | Live adaptation preview, tool calling example sandbox, preference export/import JSON | Buttons function; persisted across reload |
| CLI | Commands: `create-app`, `add-adapter`, `export-profile`, `import-profile` | CLI tests cover command behaviors |
| Docs | Guides: Sensory, Cognitive, AI, VR, Quantum, Testing, Privacy, Extensibility. API Reference generated. | All referenced in Launchpad; no broken internal links |
| Performance & Privacy | Lazy load non-critical modules; size budget report; privacy compliance README section | Build stats file emitted (`/reports/bundle-stats.json`) |

## 5. Detailed Task Backlog (Group by Domain)

### 5.1 Core – Preferences & Events (High)
- Implement `PreferenceStore` events: `on('change', diff)`, `on('invalid', issues)`.
- External storage interface & localStorage adapter: `LocalStoragePreferenceStorage`.
- Import/export JSON schema version stamping (`schemaVersion`).
- Validation + migration hook: `registerMigration(fromVersion, fn)`.
- **Acceptance**:
  - Updating invalid value throws and does **not** mutate prior state.
  - Migration tested with fixture versions.
  - 95% lines coverage for `preferences/`.

### 5.2 Sensory Management (High)
- Extend `VisualAdapter`:
  - Color vision filters: protanopia/deuteranopia/tritanopia simulation via CSS filters.
  - Reduced flashing: detect rapid opacity/transform changes > threshold.
  - High contrast theme insertion (`data-theme="neuro-high-contrast"`).
- Add `AccessibleFocusRing` utility to unify focus styling.
- Add `sensory.disable()` & revert styles.
- **Acceptance**:
  - Launchpad toggles reflect in DOM.
  - Snapshot test for style tag insertion exactly once.

### 5.3 Cognitive Load Engine (High)
- Metrics: `readingTimeEstimate(text)`, `denseSections(text)` (long sentences + jargon).
- Overload strategy registry: `'chunk'`, `'offerBreak'`, `'simplifyLanguage'`.
- Events: `on('load-score', {score, tier})` (tiers low <40, moderate <70, high ≥70).
- Ephemeral memory: avoid repeating explanations in session.
- **Acceptance**:
  - Deterministic scores in unit tests.
  - Adaptation inserts `[BreakSuggestion]` tokens.

### 5.4 AI Layer (High)
- Unified interface:
  ```ts
  interface AIAdapter {
    complete(opts: CompleteOptions): Promise<AdaptedResponse>;
    stream?(opts: CompleteOptions): AsyncGenerator<AdaptedChunk>;
    abortController?: AbortController;
  }
  ```
- Streaming support (OpenAI / Anthropic SSE parsing).
- Exponential backoff + jitter on errors (429, 5xx).
- In-memory LRU cache (model+prompt key).
- Deterministic normalization under `consistencyLevel:'high'`.
- Tool orchestrator: parallel calls with concurrency limit.
- **Acceptance**:
  - Mock APIs validate retries, caching.
  - Streaming tests accumulate tokens; abort works.

### 5.5 PredictableAI Extension (High)
- `configure({ explanationLevels, defaultLevel, pacingStrategy })`.
- Chunker + progressive detail expansion `expand(level)`.
- `generatePreview(prompt)` returns outline.
- **Acceptance**: Example in `examples/ai-chatbot`.

### 5.6 VR / WebXR (Medium→High first slice)
- `@neuroadapt/vr` WebXR:
  - `ProximityMonitor` bounding sphere events.
  - Safe space overlay DOM modal (`Ctrl+Shift+Space`).
- Integrate `VisualAdapter` for motion.
- **Acceptance**: Simulated position triggers events.

### 5.7 Quantum Visualization (Medium)
- Dynamic Three.js import.
- `BlochSphereRenderer`: (x,y,z) mapping + color mapping.
- `exportFrame()` → data URL.
- **Acceptance**: Canvas mounts; coordinate test.

### 5.8 Testing & Simulation (High)
- `simulateProfile(overrides)` fixture helper.
- Jest utils: `withCognitiveLoad(events, fn)`.
- Axe global a11y check for all Launchpad tabs.
- **Acceptance**: CI green; coverage thresholds enforced.

### 5.9 Launchpad (High)
- Integrate real sensory & cognitive controls into demos.
- Pref export/import (JSON download/upload).
- AI streaming demo with token animation.
- Tool-calling demo (`define_term`, `summarize`).
- ARIA roles on tabs; focus management.
- Lazy-load heavy modules.
- **Acceptance**: Lighthouse performance ≥85; a11y ≥95.

### 5.10 CLI (Medium)
- `neuroadapt export-profile` → `neuroadapt-profile.json`.
- `neuroadapt import-profile file.json`.
- `neuroadapt add-adapter <name>` scaffolds adapter.
- Use `commander`.
- Tests in temp dir.
- **Acceptance**: CLI commands tested.

### 5.11 Docs & Guides (High)
- Create/complete:
  - `docs/guides/sensory-management.md`
  - `docs/guides/cognitive-adaptation.md`
  - `docs/guides/ai-predictable.md`
  - `docs/guides/webxr-vr.md`
  - `docs/guides/quantum-visualization.md`
  - `docs/guides/testing-and-ci.md`
  - `docs/privacy-and-ethics.md`
  - `docs/architecture-overview.md`
- Each: Purpose, API, code, accessibility notes, troubleshooting.
- **Acceptance**: No broken links in Launchpad.

### 5.12 Performance & Bundle Analysis (Medium)
- `scripts/analyze-bundle.mjs` with visualizer.
- Budgets: core ≤40KB gzip; ai ≤25KB gzip.
- CI fails if budgets exceeded.
- **Acceptance**: Report in `/reports/bundle-stats.json`.

### 5.13 Privacy & Compliance (Medium)
- Preference anonymization helper.
- README section: no PII capture by default.
- Stub telemetry consent interface.
- **Acceptance**: Privacy section present.

## 6. Architecture & Code Standards
1. Cohesive modules; avoid large utils.
2. Strict TS (no `any` except necessary).
3. Structured errors (`{code, message, cause?}`).
4. Optional logger interface; no `console.log` in prod.
5. Use `AbortSignal` for cancelable ops.
6. Strip API keys from errors; truncate prompts in logs.

## 7. Git & Release Workflow
- Branch: `feat/...`, `fix/...`, `docs/...`.
- Conventional commits.
- PR template must include motivation, tests, checklist.
- Manual tag `v1.1.0` after CHANGELOG update.

## 8. Metrics & Instrumentation (Deferred)
- `neuro.getDiagnostics()` hook.

## 9. Acceptance Criteria Summary
- All *High* tasks completed & tested.
- End-to-end adaptation flows in Launchpad.
- Coverage & a11y gates pass.
- Bundle size within budgets.
- Docs render; TypeDoc builds.
- Lint & TS zero errors.

## 10. Implementation Order (Vertical Slices)
1. Preferences & Validation (Core)
2. Sensory & Cognitive (DOM + heuristics)
3. AI Adapter Unification & Streaming
4. Launchpad Demos & Pref Export/Import
5. Testing & CI Hardening
6. Quantum Bloch Sphere Demo
7. VR WebXR Slice
8. CLI New Commands
9. Performance Analysis
10. Docs Pass & Release Prep

**Begin with Slice 1: Preferences & Validation Upgrade.** Report summary before moving to Slice 2.
