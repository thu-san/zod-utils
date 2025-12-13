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
- 🔍 **Extract validation checks** - Get all validation constraints (min/max, formats, patterns, etc.)
- 🔧 **Schema utilities** - Unwrap and manipulate schema types
- 📦 **Zero dependencies** - Only requires Zod as a peer dependency
- 🌐 **Universal** - Works in Node.js, browsers, and any TypeScript project

## API Reference

### `getSchemaDefaults(schema)`

Extract all default values from a Zod object schema. Only extracts fields that explicitly have `.default()` on them.

**Transform support:** Works with schemas that have `.transform()` - extracts defaults from the input type.

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

Get the primitive type of a Zod field by unwrapping optional/nullable/transform wrappers.
Stops at arrays without unwrapping them.

**Transform support:** Automatically unwraps `.transform()` to get the underlying input type.

```typescript
import { getPrimitiveType } from "@zod-utils/core";
import { z } from "zod";

const field = z.string().optional().nullable();
const primitive = getPrimitiveType(field);
// Returns the underlying string schema

const arrayField = z.array(z.string()).optional();
const arrayPrimitive = getPrimitiveType(arrayField);
// Returns the ZodArray (stops at arrays)

// Transform support
const transformed = z.string().transform((val) => val.toUpperCase());
const primitiveFromTransform = getPrimitiveType(transformed);
// Returns the underlying ZodString (unwraps the transform)
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

### `extractDefaultValue(field)`

Extract the default value from a Zod field (recursively unwraps optional/nullable/union/transform layers).

**Union handling:** For union types, extracts the default from the first option. If the first option has no default, returns `undefined` (defaults in other union options are not checked).

**Transform support:** Automatically unwraps `.transform()` to get the input type's default value.

```typescript
import { extractDefaultValue } from "@zod-utils/core";
import { z } from "zod";

// Basic usage
const field = z.string().optional().default("hello");
extractDefaultValue(field); // 'hello'

const noDefault = z.string();
extractDefaultValue(noDefault); // undefined

// Union with default in first option
const unionField = z.union([z.string().default('hello'), z.number()]);
extractDefaultValue(unionField); // 'hello'

// Union with default in second option (only checks first)
const unionField2 = z.union([z.string(), z.number().default(42)]);
extractDefaultValue(unionField2); // undefined

// Union wrapped in optional
const wrappedUnion = z.union([z.string().default('test'), z.number()]).optional();
extractDefaultValue(wrappedUnion); // 'test'

// Transform support - extracts input default, not output
const transformed = z.string().default('hello').transform((val) => val.toUpperCase());
extractDefaultValue(transformed); // 'hello' (not 'HELLO')
```

---

### `getFieldChecks(field)`

Extract all validation check definitions from a Zod schema field. Returns Zod's raw check definition objects directly, including all properties like `check`, `minimum`, `maximum`, `value`, `inclusive`, `format`, `pattern`, etc.

**Automatically unwraps:** optional, nullable, and default layers. For unions, checks only the first option.

**Supported check types:** Returns any of 21 check types:
- **Length checks**: `min_length`, `max_length`, `length_equals` (strings, arrays)
- **Size checks**: `min_size`, `max_size`, `size_equals` (files, sets, maps)
- **Numeric checks**: `greater_than`, `less_than`, `multiple_of`
- **Format checks**: `number_format`, `bigint_format`, `string_format` (email, url, uuid, etc.)
- **String pattern checks**: `regex`, `lowercase`, `uppercase`, `includes`, `starts_with`, `ends_with`
- **Other checks**: `property`, `mime_type`, `overwrite`

```typescript
import { getFieldChecks } from "@zod-utils/core";
import { z } from "zod";

// String with length constraints
const username = z.string().min(3).max(20);
const checks = getFieldChecks(username);
// [
//   { check: 'min_length', minimum: 3, when: [Function], ... },
//   { check: 'max_length', maximum: 20, when: [Function], ... }
// ]

// Number with range constraints
const age = z.number().min(18).max(120);
const checks = getFieldChecks(age);
// [
//   { check: 'greater_than', value: 18, inclusive: true, ... },
//   { check: 'less_than', value: 120, inclusive: true, ... }
// ]

// Array with item count constraints
const tags = z.array(z.string()).min(1).max(5);
const checks = getFieldChecks(tags);
// [
//   { check: 'min_length', minimum: 1, ... },
//   { check: 'max_length', maximum: 5, ... }
// ]

// String with format validation
const email = z.string().email();
const checks = getFieldChecks(email);
// [{ check: 'string_format', format: 'email', ... }]

// Unwrapping optional/nullable/default layers
const bio = z.string().min(10).max(500).optional();
const checks = getFieldChecks(bio);
// [
//   { check: 'min_length', minimum: 10, ... },
//   { check: 'max_length', maximum: 500, ... }
// ]

// No checks
const plainString = z.string();
getFieldChecks(plainString); // []
```

**Type:** The return type is `ZodUnionCheck[]`, a union of all 21 Zod check definition types. You can also import the `ZodUnionCheck` type:

```typescript
import { getFieldChecks, type ZodUnionCheck } from "@zod-utils/core";
```

---

### `extractDiscriminatedSchema(schema, key, value)`

Extract a specific variant from a discriminated union schema based on the discriminator field and value.

```typescript
import { extractDiscriminatedSchema } from "@zod-utils/core";
import { z } from "zod";

const userSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('create'),
    name: z.string(),
    age: z.number().optional(),
  }),
  z.object({
    mode: z.literal('edit'),
    id: z.number(),
    name: z.string().optional(),
    bio: z.string().optional(),
  }),
]);

// Extract the 'create' variant
const createSchema = extractDiscriminatedSchema({
  schema: userSchema,
  key: 'mode',
  value: 'create',
});
// Returns: z.ZodObject with { mode, name, age }

// Extract the 'edit' variant
const editSchema = extractDiscriminatedSchema({
  schema: userSchema,
  key: 'mode',
  value: 'edit',
});
// Returns: z.ZodObject with { mode, id, name, bio }
```

**Use with discriminated unions:** This is essential when working with `z.discriminatedUnion()` schemas, as it extracts the correct variant schema based on the discriminator value.

---

### `extractFieldFromSchema(schema, name, discriminator?)`

Extract a single field from a Zod object or discriminated union schema.

**Transform support:** Works with schemas that have `.transform()` - extracts fields from the input type.

```typescript
import { extractFieldFromSchema } from "@zod-utils/core";
import { z } from "zod";

// Simple object schema
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

const nameField = extractFieldFromSchema({
  schema: userSchema,
  name: 'name',
});
// Returns: ZodString

// Discriminated union schema
const formSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('create'),
    name: z.string(),
    age: z.number().optional(),
  }),
  z.object({
    mode: z.literal('edit'),
    id: z.number(),
    name: z.string().optional(),
  }),
]);

// Extract field from specific variant
const idField = extractFieldFromSchema({
  schema: formSchema,
  name: 'id',
  discriminator: {
    key: 'mode',
    value: 'edit',
  },
});
// Returns: ZodNumber

// Without discriminator on discriminated union, returns undefined
const fieldWithoutDiscriminator = extractFieldFromSchema({
  schema: formSchema,
  name: 'name',
});
// Returns: undefined (need discriminator to know which variant)

// Works with transforms - extracts from input type
const transformedSchema = z
  .object({
    name: z.string(),
    age: z.number(),
  })
  .transform((data) => ({ ...data, computed: true }));

const nameFromTransformed = extractFieldFromSchema({
  schema: transformedSchema,
  name: 'name',
});
// Returns: ZodString (from the input type, not affected by transform)
```

**Discriminated union support:** When extracting fields from discriminated unions, you must provide the `discriminator` option with `key` and `value` to specify which variant to use.

---

### `extendWithMeta(field, transform)`

Extends a Zod field with a transformation while preserving its metadata.

This is useful when you want to add validations or transformations to a field but keep the original metadata (like `translationKey`) intact.

```typescript
import { extendWithMeta } from "@zod-utils/core";
import { z } from "zod";

// Base field with metadata
const baseField = z.string().meta({ translationKey: 'user.field.name' });

// Extend with validation while keeping metadata
const extendedField = extendWithMeta(baseField, (f) => f.min(3).max(100));

extendedField.meta(); // { translationKey: 'user.field.name' }

// Validation still works
extendedField.parse('ab');     // throws - too short
extendedField.parse('abc');    // 'abc' - valid
```

**Use case:** When building forms with shared field definitions, you may want to reuse a base field with metadata across multiple schemas while adding schema-specific validations:

```typescript
// Shared field definitions with i18n metadata
const fields = {
  name: z.string().meta({ translationKey: 'user.field.name' }),
  email: z.string().email().meta({ translationKey: 'user.field.email' }),
};

// Create form uses base fields with additional constraints
const createFormSchema = z.object({
  name: extendWithMeta(fields.name, (f) => f.min(3).max(50)),
  email: extendWithMeta(fields.email, (f) => f.min(5)),
});

// Edit form uses same fields with different constraints
const editFormSchema = z.object({
  name: extendWithMeta(fields.name, (f) => f.optional()),
  email: fields.email, // no extension needed
});
```

**Note:** If the original field has no metadata, the transformed field is returned as-is without calling `.meta()`.

---

### `getSchemaDefaults(schema, discriminator?)`

**Updated:** Now supports discriminated union schemas with the `discriminator` option.

```typescript
import { getSchemaDefaults } from "@zod-utils/core";
import { z } from "zod";

// Discriminated union with defaults
const formSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('create'),
    name: z.string(),
    age: z.number().default(18),
  }),
  z.object({
    mode: z.literal('edit'),
    id: z.number().default(1),
    name: z.string().optional(),
    bio: z.string().default('bio goes here'),
  }),
]);

// Get defaults for 'create' mode
const createDefaults = getSchemaDefaults(formSchema, {
  discriminator: {
    key: 'mode',
    value: 'create',
  },
});
// Returns: { age: 18 }

// Get defaults for 'edit' mode
const editDefaults = getSchemaDefaults(formSchema, {
  discriminator: {
    key: 'mode',
    value: 'edit',
  },
});
// Returns: { id: 1, bio: 'bio goes here' }

// Without discriminator, returns empty object
const noDefaults = getSchemaDefaults(formSchema);
// Returns: {}
```

**Discriminator types:** The discriminator `value` can be a string, number, or boolean literal that matches the discriminator field type.

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

### `DiscriminatedInput<TSchema, TDiscriminatorKey, TDiscriminatorValue>`

Extracts the input type from a discriminated union variant. For discriminated unions, narrows to the variant matching the discriminator value and returns its input type. For regular schemas, returns the full input type.

```typescript
import type { DiscriminatedInput } from "@zod-utils/core";
import { z } from "zod";

const schema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("create"), name: z.string() }),
  z.object({ mode: z.literal("edit"), id: z.number() }),
]);

type CreateInput = DiscriminatedInput<typeof schema, "mode", "create">;
// { mode: 'create'; name: string }

type EditInput = DiscriminatedInput<typeof schema, "mode", "edit">;
// { mode: 'edit'; id: number }
```

---

### `ValidPaths<TSchema, TDiscriminatorKey?, TDiscriminatorValue?, TFilterType?, TStrict?>`

Generates valid dot-notation paths for a schema, with optional type filtering and discriminated union support.

**Parameters:**
- `TSchema` - The Zod schema type
- `TDiscriminatorKey` - Discriminator key for discriminated unions (default: `never`)
- `TDiscriminatorValue` - Discriminator value to filter variant (default: `never`)
- `TFilterType` - Type to filter paths by (default: `unknown` = all paths)
- `TStrict` - Strict mode for type matching (default: `true`)

**Basic usage:**

```typescript
import type { ValidPaths } from "@zod-utils/core";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().optional(),
  active: z.boolean(),
});

// Get all paths (no filtering)
type AllPaths = ValidPaths<typeof schema>;
// "name" | "age" | "email" | "active"

// Filter by type - only string fields
type StringPaths = ValidPaths<typeof schema, never, never, string>;
// "name"

// Non-strict mode - includes optional string fields
type StringPathsNonStrict = ValidPaths<typeof schema, never, never, string, false>;
// "name" | "email"
```

**With discriminated unions:**

```typescript
const formSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("create"), name: z.string(), age: z.number() }),
  z.object({ mode: z.literal("edit"), id: z.number(), title: z.string() }),
]);

// Get all paths for 'create' variant
type CreatePaths = ValidPaths<typeof formSchema, "mode", "create">;
// "mode" | "name" | "age"

// Get number paths for 'edit' variant
type EditNumberPaths = ValidPaths<typeof formSchema, "mode", "edit", number>;
// "id"
```

**Strict vs Non-Strict mode:**

```typescript
const schema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
});

// Strict mode (default) - exact type matching
type StrictPaths = ValidPaths<typeof schema, never, never, string>;
// "required" - only exact string

// Non-strict mode - includes subtypes
type NonStrictPaths = ValidPaths<typeof schema, never, never, string, false>;
// "required" | "optional" | "nullable"
```

---

### `Paths<T, FilterType?, Strict?>`

Low-level type utility for generating dot-notation paths from any type (not schema-specific).

```typescript
import type { Paths } from "@zod-utils/core";

type User = {
  name: string;
  age: number;
  profile: { bio: string };
};

// All paths
type AllPaths = Paths<User>;
// "name" | "age" | "profile" | "profile.bio"

// Filtered by string
type StringPaths = Paths<User, string>;
// "name" | "profile.bio"
```

---

### `FieldSelector<TSchema, TName, TDiscriminatorKey?, TDiscriminatorValue?, TFilterType?, TStrict?>`

Utility type for creating typed parameter objects that include schema, field name, and optional discriminator. Useful for building type-safe form field components.

```typescript
import type { FieldSelector } from "@zod-utils/core";
import { z } from "zod";

// Regular schema - no discriminator required
const userSchema = z.object({ name: z.string(), age: z.number() });
type UserParams = FieldSelector<typeof userSchema, "name">;
// { schema: typeof userSchema; name: "name" }

// Discriminated union - requires discriminator
const formSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("create"), name: z.string() }),
  z.object({ mode: z.literal("edit"), id: z.number() }),
]);
type FormParams = FieldSelector<typeof formSchema, "name", "mode", "create">;
// { schema: typeof formSchema; name: "name"; discriminator: { key: "mode"; value: "create" } }
```

---

## License

MIT
