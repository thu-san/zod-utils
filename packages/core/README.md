# @zod-utils/core

[![npm version](https://img.shields.io/npm/v/@zod-utils/core.svg)](https://www.npmjs.com/package/@zod-utils/core)
[![npm downloads](https://img.shields.io/npm/dm/@zod-utils/core.svg)](https://www.npmjs.com/package/@zod-utils/core)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@zod-utils/core)](https://bundlephobia.com/package/@zod-utils/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/thu-san/zod-utils/workflows/CI/badge.svg)](https://github.com/thu-san/zod-utils/actions)
[![codecov](https://codecov.io/gh/thu-san/zod-utils/branch/main/graph/badge.svg?flag=core)](https://codecov.io/gh/thu-san/zod-utils)

Pure TypeScript utilities for Zod schema manipulation and default extraction. No React dependencies.

## Installation

```bash
npm install @zod-utils/core zod
```

## Related Packages

- **[@zod-utils/react-hook-form](https://www.npmjs.com/package/@zod-utils/react-hook-form)** - React Hook Form integration with automatic type transformation. Uses this package internally and re-exports all utilities for convenience.

## Features

- 🎯 **Extract defaults** - Get default values from Zod schemas
- ✅ **Check validation requirements** - Determine if fields will error on empty input
- 🔧 **Schema utilities** - Unwrap and manipulate schema types
- 📦 **Zero dependencies** - Only requires Zod as a peer dependency
- 🌐 **Universal** - Works in Node.js, browsers, and any TypeScript project

## API Reference

### `getSchemaDefaults(schema)`

Extract all default values from a Zod object schema. Only extracts fields that explicitly have `.default()` on them.

```typescript
import { getSchemaDefaults } from "@zod-utils/core";
import { z } from "zod";

const schema = z.object({
  name: z.string().default("John Doe"),
  age: z.number().default(25),
  email: z.string().email(), // no default - skipped
  settings: z
    .object({
      theme: z.string().default("light"),
      notifications: z.boolean().default(true),
    })
    .default({}), // must have explicit .default() to be extracted
  tags: z.array(z.string()).default([]),
});

const defaults = getSchemaDefaults(schema);
// {
//   name: 'John Doe',
//   age: 25,
//   settings: {},
//   tags: []
// }
```

**Important:** Only fields with explicit `.default()` are extracted. Nested object fields without an explicit default on the parent field are not extracted, even if they contain defaults internally.

**Handles:**

- Optional fields with defaults: `.optional().default(value)`
- Nullable fields with defaults: `.nullable().default(value)`
- Arrays with defaults: `.array().default([])`
- Objects with defaults: `.object({...}).default({})`
- Skips fields without explicit defaults

---

### `requiresValidInput(field)`

Determines if a field will show validation errors when the user submits empty or invalid input. Useful for form UIs to show which fields need valid user input (asterisks, validation indicators).

**Key insight:** Defaults are just initial values - they don't prevent validation errors if the user clears the field.

**Real-world example:**

```typescript
// Marital status with default but validation rules
const maritalStatus = z.string().min(1).default('single');

// What happens in the form:
// 1. Initial: field shows "single" (from default)
// 2. User deletes the value → empty string
// 3. User submits form → validation fails (.min(1) rejects empty)
// 4. requiresValidInput(maritalStatus) → true (show *, show error)
```

**How it works:**

1. Removes `.default()` wrappers (defaults ≠ validation rules)
2. Tests if underlying schema accepts empty/invalid input:
   - `undefined` (via `.optional()`)
   - `null` (via `.nullable()`)
   - Empty string (plain `z.string()`)
   - Empty array (plain `z.array()`)
3. Returns `true` if validation will fail on empty input

**Examples:**

```typescript
import { requiresValidInput } from "@zod-utils/core";
import { z } from "zod";

// User name - required, no default
const userName = z.string().min(1);
requiresValidInput(userName); // true - will error if empty

// Marital status - required WITH default
const maritalStatus = z.string().min(1).default('single');
requiresValidInput(maritalStatus); // true - will error if user clears it

// Age with default - requires valid input
const age = z.number().default(0);
requiresValidInput(age); // true - numbers reject empty strings

// Optional bio - doesn't require input
const bio = z.string().optional();
requiresValidInput(bio); // false - user can leave empty

// Notes with default but NO validation
const notes = z.string().default('N/A');
requiresValidInput(notes); // false - plain z.string() accepts empty

// Nullable middle name
const middleName = z.string().nullable();
requiresValidInput(middleName); // false - user can leave null
```

---

### `getPrimitiveType(field)`

Get the primitive type of a Zod field by unwrapping optional/nullable wrappers.
Stops at arrays without unwrapping them.

```typescript
import { getPrimitiveType } from "@zod-utils/core";
import { z } from "zod";

const field = z.string().optional().nullable();
const primitive = getPrimitiveType(field);
// Returns the underlying string schema

const arrayField = z.array(z.string()).optional();
const arrayPrimitive = getPrimitiveType(arrayField);
// Returns the ZodArray (stops at arrays)
```

---

### `removeDefault(field)`

Remove default values from a Zod field.

```typescript
import { removeDefault } from "@zod-utils/core";
import { z } from "zod";

const withDefault = z.string().default("hello");
const withoutDefault = removeDefault(withDefault);

withDefault.parse(undefined); // 'hello'
withoutDefault.parse(undefined); // throws error
```

---

### `extractDefault(field)`

Extract the default value from a Zod field (recursively unwraps optional/nullable).

```typescript
import { extractDefault } from "@zod-utils/core";
import { z } from "zod";

const field = z.string().optional().default("hello");
extractDefault(field); // 'hello'

const noDefault = z.string();
extractDefault(noDefault); // undefined
```

---

## Type Utilities

### `Simplify<T>`

Simplify complex types for better IDE hints.

```typescript
import type { Simplify } from "@zod-utils/core";

type Complex = { a: string } & { b: number };
type Simple = Simplify<Complex>;
// { a: string; b: number }
```

---

## License

MIT
