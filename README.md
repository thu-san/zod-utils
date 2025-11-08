# @zod-utils

A collection of TypeScript utilities for Zod schemas, with React Hook Form integration.

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

### [@zod-utils/react](./packages/react)

React Hook Form integration and utilities for Zod schemas.

```bash
npm install @zod-utils/react zod react react-hook-form @hookform/resolvers
```

**Features:**
- Type-safe `useZodForm` hook
- Custom error resolver with i18n support (Japanese)
- Re-exports all `@zod-utils/core` utilities

## Quick Start

```typescript
import { getSchemaDefaults } from '@zod-utils/core';
import { useZodForm } from '@zod-utils/react';
import { z } from 'zod';

// Define your schema
const schema = z.object({
  name: z.string().default('John Doe'),
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

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build a specific package
npm run build:lib    # @zod-utils/core

# Run demo app
npm run dev
```

## Monorepo Structure

```
zod-utils/
├── apps/
│   └── demo/                 # Next.js demo application
├── packages/
│   ├── core/                 # @zod-utils/core
│   └── react/                # @zod-utils/react
└── package.json              # Workspace root
```

## Future Packages

Planned additions:
- `@zod-utils/openapi` - OpenAPI/Swagger integration
- `@zod-utils/i18n` - Internationalization utilities

## License

MIT
