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
- ✅ **Check required fields** - Determine if fields are required
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

### `checkIfFieldIsRequired(field)`

Check if a Zod field is required. Returns `false` if the field accepts any of:

- `undefined` (via `.optional()` or `.default()`)
- `null` (via `.nullable()`)
- Empty string (plain `z.string()` without `.min(1)` or `.nonempty()`)
- Empty array (plain `z.array()` without `.min(1)` or `.nonempty()`)

```typescript
import { checkIfFieldIsRequired } from "@zod-utils/core";
import { z } from "zod";

// Required fields - return true
const requiredString = z.string().min(1);
const nonemptyString = z.string().nonempty();
const requiredArray = z.array(z.string()).min(1);
const nonemptyArray = z.array(z.string()).nonempty();

checkIfFieldIsRequired(requiredString); // true
checkIfFieldIsRequired(nonemptyString); // true
checkIfFieldIsRequired(requiredArray); // true
checkIfFieldIsRequired(nonemptyArray); // true

// Fields accepting undefined - return false
const optionalField = z.string().optional();
const fieldWithDefault = z.string().default("hello");

checkIfFieldIsRequired(optionalField); // false
checkIfFieldIsRequired(fieldWithDefault); // false

// Fields accepting empty values - return false
const emptyStringAllowed = z.string();
const emptyArrayAllowed = z.array(z.string());

checkIfFieldIsRequired(emptyStringAllowed); // false
checkIfFieldIsRequired(emptyArrayAllowed); // false

// Fields accepting null - return false
const nullableField = z.string().nullable();

checkIfFieldIsRequired(nullableField); // false
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
