# @zod-utils/core

[![npm version](https://img.shields.io/npm/v/@zod-utils/core.svg)](https://www.npmjs.com/package/@zod-utils/core)
[![npm downloads](https://img.shields.io/npm/dm/@zod-utils/core.svg)](https://www.npmjs.com/package/@zod-utils/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/thu-san/zod-utils/workflows/CI/badge.svg)](https://github.com/thu-san/zod-utils/actions)

Pure TypeScript utilities for Zod schema manipulation and default extraction. No React dependencies.

## Installation

```bash
npm install @zod-utils/core zod
```

## Features

- 🎯 **Extract defaults** - Get default values from Zod schemas
- ✅ **Check required fields** - Determine if fields are required
- 🔧 **Schema utilities** - Unwrap and manipulate schema types
- 📦 **Zero dependencies** - Only requires Zod as a peer dependency
- 🌐 **Universal** - Works in Node.js, browsers, and any TypeScript project

## API Reference

### `getSchemaDefaults(schema)`

Extract all default values from a Zod object schema. Recursively handles nested objects.

```typescript
import { getSchemaDefaults } from '@zod-utils/core';
import { z } from 'zod';

const schema = z.object({
  name: z.string().default('John Doe'),
  age: z.number().default(25),
  email: z.string().email(), // no default - skipped
  settings: z.object({
    theme: z.string().default('light'),
    notifications: z.boolean().default(true),
  }),
  tags: z.array(z.string()).default([]),
});

const defaults = getSchemaDefaults(schema);
// {
//   name: 'John Doe',
//   age: 25,
//   settings: { theme: 'light', notifications: true },
//   tags: []
// }
```

**Handles:**
- Nested objects at any depth
- Optional fields with defaults: `.optional().default(value)`
- Arrays with defaults: `.array().default([])`
- Skips fields without defaults

---

### `checkIfFieldIsRequired(field)`

Check if a Zod field is required (not optional/nullable and doesn't accept empty values).

```typescript
import { checkIfFieldIsRequired } from '@zod-utils/core';
import { z } from 'zod';

const requiredField = z.string();
const optionalField = z.string().optional();
const emptyStringAllowed = z.string().min(0);

checkIfFieldIsRequired(requiredField);     // true
checkIfFieldIsRequired(optionalField);     // false
checkIfFieldIsRequired(emptyStringAllowed); // false
```

---

### `getPrimitiveType(field, options?)`

Get the primitive type of a Zod field by unwrapping optional/nullable wrappers.

```typescript
import { getPrimitiveType } from '@zod-utils/core';
import { z } from 'zod';

const field = z.string().optional().nullable();
const primitive = getPrimitiveType(field);
// Returns the underlying string schema

// Options
getPrimitiveType(z.array(z.string()), { unwrapArrays: false }); // Stops at array
getPrimitiveType(z.array(z.string()), { unwrapArrays: true });  // Continues unwrapping
```

---

### `removeDefault(field)`

Remove default values from a Zod field.

```typescript
import { removeDefault } from '@zod-utils/core';
import { z } from 'zod';

const withDefault = z.string().default('hello');
const withoutDefault = removeDefault(withDefault);

withDefault.parse(undefined);     // 'hello'
withoutDefault.parse(undefined);  // throws error
```

---

### `extractDefault(field)`

Extract the default value from a Zod field (recursively unwraps optional/nullable).

```typescript
import { extractDefault } from '@zod-utils/core';
import { z } from 'zod';

const field = z.string().optional().default('hello');
extractDefault(field); // 'hello'

const noDefault = z.string();
extractDefault(noDefault); // undefined
```

---

### `getUnwrappedType(field)`

Get the unwrapped type without going through defaults. Useful for detecting nested objects/arrays.

```typescript
import { getUnwrappedType } from '@zod-utils/core';
import { z } from 'zod';

const field = z.object({ name: z.string() }).optional().default({});
const unwrapped = getUnwrappedType(field);
// Returns the ZodObject (preserves the default wrapper)
```

---

## Type Utilities

### `MakeOptionalAndNullable<T>`

Make all properties optional and nullable. Useful for form input types.

```typescript
import type { MakeOptionalAndNullable } from '@zod-utils/core';

type User = {
  name: string;
  age: number;
};

type FormInput = MakeOptionalAndNullable<User>;
// { name?: string | null; age?: number | null; }
```

### `Simplify<T>`

Simplify complex types for better IDE hints.

```typescript
import type { Simplify } from '@zod-utils/core';

type Complex = { a: string } & { b: number };
type Simple = Simplify<Complex>;
// { a: string; b: number }
```

### `PickArrayObject<T>`

Extract the element type from an array.

```typescript
import type { PickArrayObject } from '@zod-utils/core';

type Users = Array<{ name: string }>;
type User = PickArrayObject<Users>;
// { name: string }
```

---

## License

MIT
