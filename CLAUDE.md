# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript monorepo containing utilities for Zod schema manipulation with React Hook Form integration. Built with npm workspaces, targeting **Zod v4** specifically.

**Core Value Proposition:** The `useZodForm` hook automatically transforms Zod schema types so form inputs accept `null | undefined` during editing, while validated output remains exactly as the schema defines. No manual type wrestling required.

## Monorepo Architecture

### Package Structure
- **`packages/core`** - Pure TypeScript utilities (no React dependencies)
  - Schema manipulation (`getSchemaDefaults`, `requiresValidInput`)
  - Type unwrapping (`getPrimitiveType`, `removeDefault`, `extractDefault`)
  - Zero dependencies except Zod peer dependency

- **`packages/react-hook-form`** - React Hook Form integration
  - `useZodForm` hook with automatic type transformation
  - Uses `MakeOptionalAndNullable<T>` type utility for form inputs
  - Re-exports all `@zod-utils/core` utilities for convenience
  - Depends on `@zod-utils/core` internally

- **`apps/demo`** - Next.js demo application
  - Shows comprehensive examples of required/optional fields
  - All field types: string, number, array, object

### Dependency Flow
```
@zod-utils/core (standalone)
       ↑
@zod-utils/react-hook-form (depends on core)
       ↑
apps/demo (uses react-hook-form package)
```

## Development Commands

### Building
```bash
# Build all packages (required before testing cross-package dependencies)
npm run build

# Build individual packages
npm run build:core      # @zod-utils/core
npm run build:rhf       # @zod-utils/react-hook-form
npm run build:demo      # Next.js demo app
```

**Important:** Always build packages before testing to ensure latest changes are reflected in dependent packages.

### Testing
```bash
# Run all tests across workspaces
npm test

# Test individual packages
npm test --workspace=packages/core
npm test --workspace=packages/react-hook-form

# Watch mode for development
npm run test:watch --workspace=packages/core

# Coverage reports
npm run test:coverage
npm run test:coverage --workspace=packages/core
```

Each package uses **Vitest** for testing. The react-hook-form package uses `@testing-library/react` with jsdom environment.

### Linting
```bash
# Run all linters (Biome + ESLint + TypeScript)
npm run lint

# Auto-fix with Biome
npm run lint:fix

# Individual checks
npx biome check .               # Biome only
npm run lint:eslint             # ESLint only
npm run lint:typescript         # TypeScript compiler only
```

Uses **Biome** as primary linter/formatter. ESLint is used for additional rules. TypeScript strict mode enabled.

### Development Server
```bash
# Run demo app
npm run dev  # or npm run dev --workspace=apps/demo

# Watch mode for package development
npm run dev --workspace=packages/core       # Rebuilds on changes
npm run dev --workspace=packages/react-hook-form
```

**⚠️ IMPORTANT: Claude should NEVER start the dev server automatically.**
- Dev servers run in background and cause lock file conflicts
- Multiple instances can bind to the same port
- **Instead, ask the developer to run the dev server themselves**
- When checking for errors, use `npm run build` or `npm run lint:typescript` instead
- If accidentally started, stop immediately with `pkill -f "next dev"` or `KillShell`

### Publishing
```bash
# Individual packages
npm run publish:core
npm run publish:rhf

# All packages (builds first)
npm run publish:all
```

Both packages configured with `publishConfig.access: "public"` for npm.

### Bundle Size Checking
```bash
npm run size
```

Size limits enforced:
- `@zod-utils/core`: 10 KB (excluding zod)
- `@zod-utils/react-hook-form`: 10 KB (excluding zod, react, react-hook-form, @hookform/resolvers, @zod-utils/core)

### Performance Benchmarking
```bash
# Run all benchmarks across packages
npm run bench

# Run benchmarks for specific package
npm run bench:core                                      # @zod-utils/core only
npm run bench:rhf                                       # @zod-utils/react-hook-form only

# Watch mode for benchmark development
npm run bench:watch --workspace=packages/core           # Core package
npm run bench:watch --workspace=packages/react-hook-form # React Hook Form package
```

**Benchmark Organization:**
- Benchmarks are located in `packages/*/benchmarks/*.bench.ts`
- Uses Vitest's built-in benchmark functionality
- Automatically run in CI on every push to main and PRs
- Results stored as artifacts for 30 days

**Core Package Benchmarks:**
- `defaults.bench.ts` - Tests `getSchemaDefaults` and `extractDefault` performance
  - Simple schemas (3 fields)
  - Complex nested schemas
  - Large schemas (100+ fields)
- `schema.bench.ts` - Tests utility functions like `requiresValidInput`, `getPrimitiveType`, etc.

**React Hook Form Package Benchmarks:**
- `resolver.bench.ts` - Tests zodResolver creation and validation performance
  - Simple schemas (3 fields)
  - Complex nested schemas
  - Large schemas (50+ fields)
  - Validation with valid/invalid data
  - Schemas with refinements
  - Async validation
- `integration.bench.ts` - Tests complete form setup and validation workflows
  - Form setup (defaults extraction + resolver creation)
  - Complete validation cycles
  - Optional/nullable field handling
  - Array and object validations
  - Refinements and transformations

**When to Run Benchmarks:**
- Before and after performance optimizations
- When adding new utility functions
- When refactoring core algorithms
- CI automatically runs them on every PR

**Interpreting Results:**
- Vitest bench shows ops/sec (operations per second)
- Higher numbers are better
- Compare results before/after changes to detect regressions
- CI artifacts show historical performance trends

## Key Technical Concepts

### Type Transformation in useZodForm
The `useZodForm` hook uses a two-type schema pattern:
```typescript
schema: z.ZodType<T, MakeOptionalAndNullable<T>>
```
- **Input type** (`MakeOptionalAndNullable<T>`): Form fields accept `null | undefined` during editing
- **Output type** (`T`): Validated data matches exact schema type

This eliminates the common TypeScript friction where React Hook Form expects nullable values but Zod schemas define strict types.

### Form Validation Requirements
`requiresValidInput()` determines if a field will show validation errors when the user submits empty/invalid input. This is for form UIs to indicate which fields need valid user input.

**Key insight:** Defaults are initial values - they don't prevent validation errors if the user clears the field.

**How it works:**
1. Removes `.default()` wrappers (defaults ≠ validation rules)
2. Checks if underlying field accepts empty/invalid input:
   - `undefined` (via `.optional()`)
   - `null` (via `.nullable()`)
   - Empty string (plain `z.string()` without `.min(1)` or `.nonempty()`)
   - Empty array (plain `z.array()` without `.min(1)` or `.nonempty()`)
3. Returns `true` if validation will fail on empty input

**Examples:**
- `z.string().default('hello')` → `false` (won't error if user clears - plain strings accept empty)
- `z.string().min(1).default('hello')` → `true` (will error if user clears - .min(1) rejects empty)
- `z.number().default(0)` → `true` (will error on empty - numbers reject empty strings)
- `z.boolean().default(false)` → `true` (will error on empty - booleans require true/false)
- `z.array(z.string()).default([])` → `false` (won't error - arrays accept empty)

Use `.nonempty()` or `.min(1)` to make strings/arrays truly required.

### Default Extraction Behavior
`getSchemaDefaults()` only extracts fields with **explicit** `.default()`:
- `z.string().default('hello')` ✅ extracted
- `z.object({ nested: z.string().default('hello') })` ❌ NOT extracted (parent has no `.default()`)
- `z.object({ nested: z.string().default('hello') }).default({})` ✅ extracted as `{}`

Nested defaults are NOT extracted unless the parent object also has an explicit `.default()`.

## Build System

### tsup Configuration
Both packages use **tsup** for building:
- Outputs: CJS (`dist/index.js`) and ESM (`dist/index.mjs`)
- Type declarations: `dist/index.d.ts`
- Source maps enabled
- Tree-shaking enabled
- Development mode: Uses `src/index.ts` directly (via exports.development)

### Workspace Conventions
- Use `--workspace=` or `--workspaces` flags with npm commands
- Cross-package dependencies use `"@zod-utils/core": "*"` (workspace protocol)
- All packages share root-level devDependencies for tooling

## Git Hooks

Pre-commit hook (`.husky/pre-commit`) runs:
```bash
npm test  # All tests must pass before commit
```

Also uses **lint-staged** with Biome for formatting staged files.

## Zod Version Requirements

All packages target **Zod v4.x** specifically. This is a peer dependency - users must install it themselves. Not compatible with Zod v3.

## Documentation Guidelines

When updating package functionality:
1. Update the relevant package README (`packages/*/README.md`)
2. Update examples in demo app if applicable (`apps/demo/src/app/page.tsx`)
3. Maintain the "💡 Why Use This?" section prominence in react-hook-form README

The react-hook-form README emphasizes the key value proposition (type transformation) at the top with concrete examples showing:
- Schema with required fields (NOT optional)
- `form.reset()` and `form.setValue()` accepting `null | undefined`
- Output type being exact `z.infer<typeof schema>` without `null | undefined`
