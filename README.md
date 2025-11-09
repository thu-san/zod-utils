# @zod-utils

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/thu-san/zod-utils/workflows/CI/badge.svg)](https://github.com/thu-san/zod-utils/actions)
[![codecov](https://codecov.io/gh/thu-san/zod-utils/branch/main/graph/badge.svg)](https://codecov.io/gh/thu-san/zod-utils)
[![Monorepo](https://img.shields.io/badge/monorepo-npm%20workspaces-blue)](https://docs.npmjs.com/cli/v7/using-npm/workspaces)

[![npm (core)](https://img.shields.io/npm/v/@zod-utils/core?label=%40zod-utils%2Fcore)](https://www.npmjs.com/package/@zod-utils/core)
[![npm (rhf)](https://img.shields.io/npm/v/@zod-utils/react-hook-form?label=%40zod-utils%2Freact-hook-form)](https://www.npmjs.com/package/@zod-utils/react-hook-form)
[![npm downloads](https://img.shields.io/npm/dm/@zod-utils/core?label=downloads)](https://www.npmjs.com/package/@zod-utils/core)
[![Bundle Size (core)](https://img.shields.io/bundlephobia/minzip/@zod-utils/core?label=core%20size)](https://bundlephobia.com/package/@zod-utils/core)
[![Bundle Size (rhf)](https://img.shields.io/bundlephobia/minzip/@zod-utils/react-hook-form?label=rhf%20size)](https://bundlephobia.com/package/@zod-utils/react-hook-form)

A collection of TypeScript utilities for Zod schemas, with React Hook Form integration.

**[🚀 Live Demo](https://thu-san.github.io/zod-utils/)** | [📦 Packages](#packages) | [📖 Documentation](./GITHUB_PAGES.md)

## Packages

This monorepo contains the following packages:

### [@zod-utils/core](./packages/core)

Pure TypeScript utilities for Zod schema manipulation and default extraction. No React dependencies.

```bash
npm install @zod-utils/core zod
```

**Features:**

- Extract default values from schemas (`getSchemaDefaults`)
- Check if fields are required (`checkIfFieldIsRequired`)
- Unwrap and manipulate schema types
- TypeScript utility types

### [@zod-utils/react-hook-form](./packages/react-hook-form)

React Hook Form integration and utilities for Zod schemas.

```bash
npm install @zod-utils/react-hook-form zod react react-hook-form @hookform/resolvers
```

**Features:**

- Type-safe `useZodForm` hook
- Custom error resolver with i18n support (Japanese)
- Re-exports all `@zod-utils/core` utilities

## Quick Start

```typescript
import { getSchemaDefaults } from "@zod-utils/core";
import { useZodForm } from "@zod-utils/react-hook-form";
import { z } from "zod";

// Define your schema
const schema = z.object({
  name: z.string().default("John Doe"),
  age: z.number().default(25),
  email: z.string().email(),
});

// Extract defaults
const defaults = getSchemaDefaults(schema);
// { name: 'John Doe', age: 25 }

// Use in React Hook Form
function MyForm() {
  const form = useZodForm({
    schema,
    defaultValues: defaults,
  });

  // ...
}
```

## Examples

See the [demo app](./apps/demo) for complete examples.

## Testing & Coverage

All packages are thoroughly tested with [Vitest](https://vitest.dev/).

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch --workspace=packages/core
```

### Coverage Reports

- **Overall**: [![codecov](https://codecov.io/gh/thu-san/zod-utils/branch/main/graph/badge.svg)](https://codecov.io/gh/thu-san/zod-utils)
- **@zod-utils/core**: [![codecov](https://codecov.io/gh/thu-san/zod-utils/branch/main/graph/badge.svg?flag=core)](https://codecov.io/gh/thu-san/zod-utils?flags[0]=core)
- **@zod-utils/react-hook-form**: [![codecov](https://codecov.io/gh/thu-san/zod-utils/branch/main/graph/badge.svg?flag=react-hook-form)](https://codecov.io/gh/thu-san/zod-utils?flags[0]=react-hook-form)

Coverage is automatically tracked via [Codecov](https://codecov.io/gh/thu-san/zod-utils) on every push to main.

## Performance

All utilities are designed for high performance and minimal overhead.

### Benchmarking

We use [Vitest benchmarks](https://vitest.dev/guide/features.html#benchmarking) to track performance:

```bash
# Run all benchmarks
npm run bench

# Run benchmarks for specific packages
npm run bench:core  # @zod-utils/core
npm run bench:rhf   # @zod-utils/react-hook-form
```

### Benchmark Coverage

**@zod-utils/core:**

- **Default extraction** (`getSchemaDefaults`, `extractDefault`)
  - Simple schemas (3 fields)
  - Complex nested schemas
  - Large schemas (100+ fields)
- **Schema utilities** (`checkIfFieldIsRequired`, `getPrimitiveType`, `removeDefault`, `canUnwrap`)
  - Various schema types and edge cases

**@zod-utils/react-hook-form:**

- **Resolver performance** (zodResolver creation and validation)
  - Simple to complex schemas
  - Valid and invalid data validation
  - Schemas with refinements and async validation
- **Integration workflows** (complete form setup and validation)
  - Form initialization with defaults
  - Optional/nullable field handling
  - Array, object, and nested validations

### CI Integration

Benchmarks run automatically on every push to main and on all PRs. Results are stored as artifacts for 30 days, allowing you to track performance trends over time.

**View benchmark results:**

1. Go to [GitHub Actions](https://github.com/thu-san/zod-utils/actions)
2. Select a workflow run
3. Download benchmark artifacts

### Bundle Size

Bundle sizes are enforced and monitored:

- **@zod-utils/core**: ≤ 10 KB (minified + gzipped, excluding zod)
- **@zod-utils/react-hook-form**: ≤ 10 KB (minified + gzipped, excluding dependencies)

See live bundle sizes: [Core](https://bundlephobia.com/package/@zod-utils/core) | [React Hook Form](https://bundlephobia.com/package/@zod-utils/react-hook-form)

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build a specific package
npm run build:core   # @zod-utils/core
npm run build:rhf    # @zod-utils/react-hook-form

# Run demo app
npm run dev
```

For release instructions, see [RELEASING.md](./RELEASING.md).

## Monorepo Structure

```
zod-utils/
├── apps/
│   └── demo/                      # Next.js demo application
├── packages/
│   ├── core/                      # @zod-utils/core
│   └── react-hook-form/           # @zod-utils/react-hook-form
└── package.json                   # Workspace root
```

## Future Packages

Planned additions:

- `@zod-utils/openapi` - OpenAPI/Swagger integration
- `@zod-utils/i18n` - Internationalization utilities

## License

MIT
