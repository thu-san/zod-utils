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

- **Extract defaults** - Get default values from Zod schemas
- **Check validation requirements** - Determine if fields will error on empty input
- **Extract validation checks** - Get all validation constraints (min/max, formats, patterns, etc.)
- **Schema utilities** - Unwrap and manipulate schema types
- **Zero dependencies** - Only requires Zod as a peer dependency
- **Universal** - Works in Node.js, browsers, and any TypeScript project

---

- [@zod-utils/core](#zod-utilscore)
  - [Installation](#installation)
  - [Related Packages](#related-packages)
  - [Features](#features)
  - [Quick Start](#quick-start)
  - [API Reference](#api-reference)
    - [`getSchemaDefaults(schema, options?)`](#getschemadefaultsschema-options)
      - [Basic Example](#basic-example)
      - [With Optional and Nullable Fields](#with-optional-and-nullable-fields)
      - [With Function Defaults](#with-function-defaults)
      - [Nested Objects](#nested-objects)
      - [With Discriminated Unions](#with-discriminated-unions)
      - [With Schema Transforms](#with-schema-transforms)
    - [`requiresValidInput(field)`](#requiresvalidinputfield)
      - [How It Works](#how-it-works)
      - [String Fields](#string-fields)
      - [Number Fields](#number-fields)
      - [Boolean Fields](#boolean-fields)
      - [Array Fields](#array-fields)
      - [Object Fields](#object-fields)
      - [Other Types](#other-types)
      - [Real-World Form Example](#real-world-form-example)
    - [`extractDefaultValue(field)`](#extractdefaultvaluefield)
      - [Basic Usage](#basic-usage)
      - [With Wrappers](#with-wrappers)
      - [With Function Defaults](#with-function-defaults-1)
      - [With Transforms](#with-transforms)
      - [With Unions](#with-unions)
    - [`getPrimitiveType(field)`](#getprimitivetypefield)
      - [Basic Usage](#basic-usage-1)
      - [Stops at Arrays](#stops-at-arrays)
      - [With Transforms](#with-transforms-1)
      - [With Unions](#with-unions-1)
    - [`removeDefault(field)`](#removedefaultfield)
    - [`getFieldChecks(field)`](#getfieldchecksfield)
      - [String Validations](#string-validations)
      - [Number Validations](#number-validations)
      - [Array Validations](#array-validations)
      - [Date Validations](#date-validations)
      - [Unwrapping Behavior](#unwrapping-behavior)
      - [No Constraints](#no-constraints)
      - [Using Checks in UI](#using-checks-in-ui)
    - [`extractDiscriminatedSchema(props)`](#extractdiscriminatedschemaprops)
      - [With Different Discriminator Types](#with-different-discriminator-types)
    - [`extractFieldFromSchema(props)`](#extractfieldfromschemaprops)
      - [Basic Usage](#basic-usage-2)
      - [Nested Paths](#nested-paths)
      - [Array Element Access](#array-element-access)
      - [With Discriminated Unions](#with-discriminated-unions-1)
      - [With Transforms](#with-transforms-2)
    - [`extendWithMeta(field, transform)`](#extendwithmetafield-transform)
      - [Use Case: Shared Field Definitions with i18n](#use-case-shared-field-definitions-with-i18n)
    - [`toFieldSelector(props)`](#tofieldselectorprops)
  - [Type Utilities](#type-utilities)
    - [`Simplify<T>`](#simplifyt)
    - [`Paths<T, FilterType?, Strict?>`](#pathst-filtertype-strict)
      - [Basic Usage](#basic-usage-3)
      - [Filter by Type](#filter-by-type)
      - [Strict vs Non-Strict Mode](#strict-vs-non-strict-mode)
    - [`ValidPaths<TSchema, TDiscriminatorKey?, TDiscriminatorValue?, TFilterType?, TStrict?>`](#validpathstschema-tdiscriminatorkey-tdiscriminatorvalue-tfiltertype-tstrict)
      - [Basic Usage](#basic-usage-4)
      - [Filter by Type](#filter-by-type-1)
      - [With Discriminated Unions](#with-discriminated-unions-2)
    - [`FieldSelector<TSchema, TName, TDiscriminatorKey?, TDiscriminatorValue?, TFilterType?, TStrict?>`](#fieldselectortschema-tname-tdiscriminatorkey-tdiscriminatorvalue-tfiltertype-tstrict)
    - [`DiscriminatedInput<TSchema, TDiscriminatorKey, TDiscriminatorValue>`](#discriminatedinputtschema-tdiscriminatorkey-tdiscriminatorvalue)
  - [Migration Guide](#migration-guide)
    - [Migrating to v3.0.0](#migrating-to-v300)
      - [`ValidPathsOfType` removed → Use `ValidPaths` with type filtering](#validpathsoftype-removed--use-validpaths-with-type-filtering)
    - [Migrating to v4.0.0](#migrating-to-v400)
      - [`mergeFieldSelectorProps` renamed → Use `toFieldSelector`](#mergefieldselectorprops-renamed--use-tofieldselector)
  - [License](#license)

---

## Quick Start

```typescript
import { z } from "zod";
import {
  getSchemaDefaults,
  requiresValidInput,
  extractDefaultValue,
  getPrimitiveType,
  getFieldChecks,
} from "@zod-utils/core";

// Define your schema
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18).max(120).default(25),
  bio: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Extract defaults for form initialization
const defaults = getSchemaDefaults(userSchema);
// { age: 25, tags: [] }

// Check which fields require valid input (for showing * in forms)
requiresValidInput(userSchema.shape.name); // true - has min(1)
requiresValidInput(userSchema.shape.email); // true - email validation
requiresValidInput(userSchema.shape.age); // true - number type
requiresValidInput(userSchema.shape.bio); // false - optional

// Get validation constraints for UI hints
getFieldChecks(userSchema.shape.age);
// [
//   { check: 'greater_than', value: 18, inclusive: true },
//   { check: 'less_than', value: 120, inclusive: true }
// ]
```

---

## API Reference

### `getSchemaDefaults(schema, options?)`

Extract all default values from a Zod object schema. Only extracts fields that explicitly have `.default()` on them.

#### Basic Example

```typescript
import { getSchemaDefaults } from "@zod-utils/core";
import { z } from "zod";

const schema = z.object({
  name: z.string().default("John Doe"),
  age: z.number().default(25),
  email: z.string().email(), // no default - NOT included
  active: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

const defaults = getSchemaDefaults(schema);
// {
//   name: 'John Doe',
//   age: 25,
//   active: true,
//   tags: []
// }
```

#### With Optional and Nullable Fields

```typescript
const schema = z.object({
  // Optional with default - included
  nickname: z.string().default("Anonymous").optional(),
  // Nullable with default - included
  title: z.string().default("Mr.").nullable(),
  // Optional without default - NOT included
  middleName: z.string().optional(),
  // Nullable without default - NOT included
  suffix: z.string().nullable(),
});

const defaults = getSchemaDefaults(schema);
// { nickname: 'Anonymous', title: 'Mr.' }
```

#### With Function Defaults

```typescript
const schema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  createdAt: z.number().default(() => Date.now()),
});

const defaults = getSchemaDefaults(schema);
// { id: 'a1b2c3...', createdAt: 1703980800000 }
// Functions are called at extraction time
```

#### Nested Objects

```typescript
// Nested defaults are extracted recursively
const schema = z.object({
  name: z.string().default("John"),
  settings: z.object({
    theme: z.string().default("light"),
    notifications: z.boolean().default(true),
  }),
});

getSchemaDefaults(schema);
// { name: 'John', settings: { theme: 'light', notifications: true } }

// Works with deeply nested objects too
const deepSchema = z.object({
  user: z.object({
    profile: z.object({
      displayName: z.string().default("Anonymous"),
    }),
  }),
});

getSchemaDefaults(deepSchema);
// { user: { profile: { displayName: 'Anonymous' } } }

// Explicit .default() on parent takes precedence
const explicitSchema = z.object({
  settings: z
    .object({
      theme: z.string().default("from-nested"),
    })
    .default({ theme: "explicit-value" }),
});

getSchemaDefaults(explicitSchema);
// { settings: { theme: 'explicit-value' } } - explicit default wins
```

#### With Discriminated Unions

```typescript
const formSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("create"),
    name: z.string(),
    age: z.number().default(18),
  }),
  z.object({
    mode: z.literal("edit"),
    id: z.number().default(1),
    bio: z.string().default("bio goes here"),
  }),
]);

// Get defaults for 'create' mode
const createDefaults = getSchemaDefaults(formSchema, {
  discriminator: { key: "mode", value: "create" },
});
// { age: 18 }

// Get defaults for 'edit' mode
const editDefaults = getSchemaDefaults(formSchema, {
  discriminator: { key: "mode", value: "edit" },
});
// { id: 1, bio: 'bio goes here' }

// Without discriminator, returns empty object
getSchemaDefaults(formSchema);
// {}
```

#### With Schema Transforms

```typescript
const schema = z
  .object({
    name: z.string().default("John"),
    age: z.number().default(25),
  })
  .transform((data) => ({ ...data, computed: true }));

// Extracts defaults from the INPUT type (before transform)
getSchemaDefaults(schema);
// { name: 'John', age: 25 }
```

---

### `requiresValidInput(field)`

Determines if a field will show validation errors when the user submits empty or invalid input. Useful for form UIs to show which fields need valid user input (asterisks, validation indicators).

**Key insight:** Defaults are just initial values - they don't prevent validation errors if the user clears the field.

#### How It Works

1. Removes `.default()` wrappers (defaults ≠ validation rules)
2. Tests if underlying schema accepts empty/invalid input:
   - `undefined` (via `.optional()`)
   - `null` (via `.nullable()`)
   - Empty string (plain `z.string()` without `.min(1)` or `.nonempty()`)
   - Empty array (plain `z.array()` without `.min(1)` or `.nonempty()`)
3. Returns `true` if validation will fail on empty input

#### String Fields

```typescript
import { requiresValidInput } from "@zod-utils/core";
import { z } from "zod";

// Plain string accepts empty string ""
requiresValidInput(z.string()); // false
requiresValidInput(z.string().optional()); // false
requiresValidInput(z.string().nullable()); // false

// String with min(1) requires non-empty
requiresValidInput(z.string().min(1)); // true
requiresValidInput(z.string().nonempty()); // true

// Email validation rejects empty string
requiresValidInput(z.string().email()); // true

// Default doesn't change validation requirement!
requiresValidInput(z.string().default("hello")); // false - plain string
requiresValidInput(z.string().min(1).default("hello")); // true - has min(1)
```

#### Number Fields

```typescript
// Numbers always require valid input (empty string fails)
requiresValidInput(z.number()); // true
requiresValidInput(z.number().default(0)); // true - default doesn't help

// Optional numbers don't require input
requiresValidInput(z.number().optional()); // false
requiresValidInput(z.number().nullable()); // false
```

#### Boolean Fields

```typescript
// Booleans require true/false value
requiresValidInput(z.boolean()); // true
requiresValidInput(z.boolean().default(false)); // true

// Optional booleans don't require input
requiresValidInput(z.boolean().optional()); // false
```

#### Array Fields

```typescript
// Plain arrays accept empty []
requiresValidInput(z.array(z.string())); // false
requiresValidInput(z.array(z.string()).default([])); // false

// Arrays with min(1) require at least one item
requiresValidInput(z.array(z.string()).min(1)); // true
requiresValidInput(z.array(z.string()).nonempty()); // true

// Optional arrays don't require input
requiresValidInput(z.array(z.string()).optional()); // false
```

#### Object Fields

```typescript
// Objects require some structure
requiresValidInput(z.object({ name: z.string() })); // true

// Optional objects don't require input
requiresValidInput(z.object({ name: z.string() }).optional()); // false
```

#### Other Types

```typescript
// Enums and literals require exact match
requiresValidInput(z.enum(["a", "b", "c"])); // true
requiresValidInput(z.literal("test")); // true

// Any and unknown accept everything
requiresValidInput(z.any()); // false
requiresValidInput(z.unknown()); // false

// Never rejects everything
requiresValidInput(z.never()); // true
```

#### Real-World Form Example

```typescript
const userFormSchema = z.object({
  // Required - show asterisk
  firstName: z.string().min(1), // requiresValidInput: true
  lastName: z.string().min(1), // requiresValidInput: true
  email: z.string().email(), // requiresValidInput: true
  age: z.number().min(18), // requiresValidInput: true

  // Optional - no asterisk
  middleName: z.string().optional(), // requiresValidInput: false
  nickname: z.string(), // requiresValidInput: false (empty allowed)
  bio: z.string().optional(), // requiresValidInput: false

  // Has default but still requires valid input if user clears
  role: z.string().min(1).default("user"), // requiresValidInput: true
});

// Use in form UI
function FormField({ name, schema }: { name: string; schema: z.ZodType }) {
  const field = schema.shape[name];
  const isRequired = requiresValidInput(field);

  return (
    <label>
      {name} {isRequired && <span className="text-red-500">*</span>}
      <input name={name} />
    </label>
  );
}
```

---

### `extractDefaultValue(field)`

Extract the default value from a Zod field. Recursively unwraps optional/nullable/union/transform layers.

#### Basic Usage

```typescript
import { extractDefaultValue } from "@zod-utils/core";
import { z } from "zod";

// Simple defaults
extractDefaultValue(z.string().default("hello")); // 'hello'
extractDefaultValue(z.number().default(42)); // 42
extractDefaultValue(z.boolean().default(true)); // true

// No default returns undefined
extractDefaultValue(z.string()); // undefined
extractDefaultValue(z.string().optional()); // undefined
```

#### With Wrappers

```typescript
// Unwraps optional/nullable to find default
extractDefaultValue(z.string().default("hello").optional()); // 'hello'
extractDefaultValue(z.string().default("hello").nullable()); // 'hello'
extractDefaultValue(z.string().default("hello").optional().nullable()); // 'hello'
```

#### With Function Defaults

```typescript
// Functions are called to get the value
extractDefaultValue(z.string().default(() => "dynamic")); // 'dynamic'
extractDefaultValue(z.number().default(() => Date.now())); // 1703980800000
```

#### With Transforms

```typescript
// Extracts input default, not output
const schema = z
  .string()
  .default("hello")
  .transform((val) => val.toUpperCase());

extractDefaultValue(schema); // 'hello' (not 'HELLO')
```

#### With Unions

```typescript
// Only checks first option in union
extractDefaultValue(z.union([z.string().default("hello"), z.number()]));
// undefined - unions with multiple non-nullish types return undefined

extractDefaultValue(z.union([z.string().default("hello"), z.null()]));
// 'hello' - union with nullish types extracts from first option
```

---

### `getPrimitiveType(field)`

Get the primitive type of a Zod field by unwrapping optional/nullable/default/transform wrappers. Stops at arrays without unwrapping them.

#### Basic Usage

```typescript
import { getPrimitiveType } from "@zod-utils/core";
import { z } from "zod";

// Unwraps to get underlying type
getPrimitiveType(z.string()); // ZodString
getPrimitiveType(z.string().optional()); // ZodString
getPrimitiveType(z.string().nullable()); // ZodString
getPrimitiveType(z.string().default("test")); // ZodString
getPrimitiveType(z.string().optional().nullable()); // ZodString
getPrimitiveType(z.string().default("x").optional().nullable()); // ZodString
```

#### Stops at Arrays

```typescript
// Arrays are returned as-is (not unwrapped to element type)
getPrimitiveType(z.array(z.string())); // ZodArray
getPrimitiveType(z.array(z.string()).optional()); // ZodArray
```

#### With Transforms

```typescript
// Unwraps transform to get input type
getPrimitiveType(z.string().transform((val) => val.toUpperCase())); // ZodString

getPrimitiveType(
  z.object({ name: z.string() }).transform((data) => ({ ...data, id: 1 }))
); // ZodObject
```

#### With Unions

```typescript
// Union with only nullish types - extracts the non-nullish type
getPrimitiveType(z.union([z.string(), z.null()])); // ZodString
getPrimitiveType(z.union([z.number(), z.undefined()])); // ZodNumber

// Union with multiple non-nullish types - returns union as-is
getPrimitiveType(z.union([z.string(), z.number()])); // ZodUnion
getPrimitiveType(z.union([z.literal("a"), z.literal("b")])); // ZodUnion
```

---

### `removeDefault(field)`

Remove default values from a Zod field while preserving optional/nullable wrappers.

```typescript
import { removeDefault } from "@zod-utils/core";
import { z } from "zod";

// Remove default
const withDefault = z.string().default("hello");
const withoutDefault = removeDefault(withDefault);

withDefault.parse(undefined); // 'hello'
withoutDefault.parse(undefined); // throws ZodError

// Preserves optional/nullable
const complex = z.string().default("test").optional().nullable();
const removed = removeDefault(complex);

removed.parse(undefined); // undefined (optional still works)
removed.parse(null); // null (nullable still works)
removed.parse("hello"); // 'hello'

// Returns same schema if no default
const plain = z.string();
removeDefault(plain) === plain; // true
```

---

### `getFieldChecks(field)`

Extract all validation check definitions from a Zod schema field. Returns Zod's raw check definition objects.

#### String Validations

```typescript
import { getFieldChecks } from "@zod-utils/core";
import { z } from "zod";

// Length constraints
getFieldChecks(z.string().min(3));
// [{ check: 'min_length', minimum: 3, ... }]

getFieldChecks(z.string().max(100));
// [{ check: 'max_length', maximum: 100, ... }]

getFieldChecks(z.string().min(3).max(20));
// [
//   { check: 'min_length', minimum: 3, ... },
//   { check: 'max_length', maximum: 20, ... }
// ]

getFieldChecks(z.string().length(10));
// [{ check: 'length_equals', length: 10, ... }]

// Format validations
getFieldChecks(z.string().email());
// [{ check: 'string_format', format: 'email', ... }]

getFieldChecks(z.string().url());
// [{ check: 'string_format', format: 'url', ... }]

getFieldChecks(z.string().uuid());
// [{ check: 'string_format', format: 'uuid', ... }]
```

#### Number Validations

```typescript
getFieldChecks(z.number().min(18));
// [{ check: 'greater_than', value: 18, inclusive: true, ... }]

getFieldChecks(z.number().max(120));
// [{ check: 'less_than', value: 120, inclusive: true, ... }]

getFieldChecks(z.number().min(0).max(100));
// [
//   { check: 'greater_than', value: 0, inclusive: true, ... },
//   { check: 'less_than', value: 100, inclusive: true, ... }
// ]

getFieldChecks(z.number().gt(0)); // exclusive >
// [{ check: 'greater_than', value: 0, inclusive: false, ... }]

getFieldChecks(z.number().lt(100)); // exclusive <
// [{ check: 'less_than', value: 100, inclusive: false, ... }]
```

#### Array Validations

```typescript
getFieldChecks(z.array(z.string()).min(1));
// [{ check: 'min_length', minimum: 1, ... }]

getFieldChecks(z.array(z.string()).max(10));
// [{ check: 'max_length', maximum: 10, ... }]

getFieldChecks(z.array(z.string()).min(1).max(5));
// [
//   { check: 'min_length', minimum: 1, ... },
//   { check: 'max_length', maximum: 5, ... }
// ]
```

#### Date Validations

```typescript
const minDate = new Date("2024-01-01");
const maxDate = new Date("2024-12-31");

getFieldChecks(z.date().min(minDate));
// [{ check: 'greater_than', value: Date, inclusive: true, ... }]

getFieldChecks(z.date().max(maxDate));
// [{ check: 'less_than', value: Date, inclusive: true, ... }]

getFieldChecks(z.date().min(minDate).max(maxDate));
// [
//   { check: 'greater_than', value: Date, inclusive: true, ... },
//   { check: 'less_than', value: Date, inclusive: true, ... }
// ]
```

#### Unwrapping Behavior

```typescript
// Automatically unwraps optional/nullable/default
getFieldChecks(z.string().min(3).max(20).optional());
// [{ check: 'min_length', ... }, { check: 'max_length', ... }]

getFieldChecks(z.number().min(0).max(100).nullable());
// [{ check: 'greater_than', ... }, { check: 'less_than', ... }]

getFieldChecks(z.string().min(5).max(50).default("test"));
// [{ check: 'min_length', ... }, { check: 'max_length', ... }]

getFieldChecks(
  z.string().min(10).max(500).optional().nullable().default("test")
);
// [{ check: 'min_length', ... }, { check: 'max_length', ... }]
```

#### Union Types

```typescript
// Collects checks from all union options
getFieldChecks(z.union([z.string().min(3), z.string().email()]));
// [{ check: 'min_length', minimum: 3, ... }, { check: 'string_format', format: 'email', ... }]

// Works with nullable/optional unions
getFieldChecks(z.string().min(5).nullable());
// [{ check: 'min_length', minimum: 5, ... }]
```

#### Format Types (Zod v4)

```typescript
// Format types (ZodURL, ZodEmail, ZodUUID, etc.) are fully supported
getFieldChecks(z.email());
// [{ check: 'string_format', format: 'email', ... }]

getFieldChecks(z.url());
// [{ check: 'string_format', format: 'url', ... }]

getFieldChecks(z.uuid());
// [{ check: 'string_format', format: 'uuid', ... }]
```

#### No Constraints

```typescript
// Returns empty array when no constraints
getFieldChecks(z.string()); // []
getFieldChecks(z.number()); // []
getFieldChecks(z.boolean()); // []
getFieldChecks(z.date()); // []
```

#### Using Checks in UI

```typescript
function getInputProps(field: z.ZodType) {
  const checks = getFieldChecks(field);
  const props: Record<string, unknown> = {};

  for (const check of checks) {
    switch (check.check) {
      case "min_length":
        props.minLength = check.minimum;
        break;
      case "max_length":
        props.maxLength = check.maximum;
        break;
      case "greater_than":
        props.min = check.value;
        break;
      case "less_than":
        props.max = check.value;
        break;
      case "string_format":
        if (check.format === "email") props.type = "email";
        if (check.format === "url") props.type = "url";
        break;
    }
  }

  return props;
}

// Usage
const usernameField = z.string().min(3).max(20);
getInputProps(usernameField);
// { minLength: 3, maxLength: 20 }

const ageField = z.number().min(18).max(120);
getInputProps(ageField);
// { min: 18, max: 120 }
```

---

### `extractDiscriminatedSchema(props)`

Extract a specific variant from a discriminated union schema based on the discriminator field and value.

```typescript
import { extractDiscriminatedSchema } from "@zod-utils/core";
import { z } from "zod";

const userSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("create"),
    name: z.string(),
    age: z.number().optional(),
  }),
  z.object({
    mode: z.literal("edit"),
    id: z.number(),
    name: z.string().optional(),
    bio: z.string().optional(),
  }),
]);

// Extract the 'create' variant
const createSchema = extractDiscriminatedSchema({
  schema: userSchema,
  key: "mode",
  value: "create",
});
// Returns: z.ZodObject with { mode, name, age }

// Extract the 'edit' variant
const editSchema = extractDiscriminatedSchema({
  schema: userSchema,
  key: "mode",
  value: "edit",
});
// Returns: z.ZodObject with { mode, id, name, bio }

// Invalid value returns undefined
const invalid = extractDiscriminatedSchema({
  schema: userSchema,
  key: "mode",
  value: "invalid" as any,
});
// Returns: undefined
```

#### With Different Discriminator Types

```typescript
// Boolean discriminator
const responseSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), data: z.string() }),
  z.object({ success: z.literal(false), error: z.string() }),
]);

extractDiscriminatedSchema({
  schema: responseSchema,
  key: "success",
  value: true,
});
// Returns: z.ZodObject with { success, data }

// Numeric discriminator
const statusSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal(200), message: z.string() }),
  z.object({ code: z.literal(404), error: z.string() }),
]);

extractDiscriminatedSchema({
  schema: statusSchema,
  key: "code",
  value: 200,
});
// Returns: z.ZodObject with { code, message }
```

---

### `extractFieldFromSchema(props)`

Extract a single field from a Zod object or discriminated union schema. Supports dot-notation paths for nested fields.

#### Basic Usage

```typescript
import { extractFieldFromSchema } from "@zod-utils/core";
import { z } from "zod";

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

extractFieldFromSchema({ schema: userSchema, name: "name" }); // ZodString
extractFieldFromSchema({ schema: userSchema, name: "age" }); // ZodNumber
extractFieldFromSchema({ schema: userSchema, name: "email" }); // ZodString
```

#### Nested Paths

```typescript
const schema = z.object({
  user: z.object({
    profile: z.object({
      name: z.string(),
      age: z.number(),
    }),
  }),
});

extractFieldFromSchema({ schema, name: "user" }); // ZodObject
extractFieldFromSchema({ schema, name: "user.profile" }); // ZodObject
extractFieldFromSchema({ schema, name: "user.profile.name" }); // ZodString
extractFieldFromSchema({ schema, name: "user.profile.age" }); // ZodNumber
```

#### Array Element Access

```typescript
const schema = z.object({
  addresses: z.array(
    z.object({
      street: z.string(),
      city: z.string(),
    })
  ),
});

// Use numeric index to access array elements
extractFieldFromSchema({ schema, name: "addresses.0.street" }); // ZodString
extractFieldFromSchema({ schema, name: "addresses.0.city" }); // ZodString
extractFieldFromSchema({ schema, name: "addresses.99.street" }); // ZodString (any index works)
```

#### With Discriminated Unions

```typescript
const formSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("create"),
    name: z.string(),
    age: z.number().optional(),
  }),
  z.object({
    mode: z.literal("edit"),
    id: z.number(),
    name: z.string().optional(),
  }),
]);

// Must provide discriminator for discriminated unions
extractFieldFromSchema({
  schema: formSchema,
  name: "name",
  discriminator: { key: "mode", value: "create" },
}); // ZodString

extractFieldFromSchema({
  schema: formSchema,
  name: "id",
  discriminator: { key: "mode", value: "edit" },
}); // ZodNumber

// Without discriminator, returns undefined
extractFieldFromSchema({
  schema: formSchema,
  name: "name",
}); // undefined
```

#### With Transforms

```typescript
const schema = z
  .object({
    name: z.string(),
    age: z.number(),
  })
  .transform((data) => ({ ...data, computed: true }));

// Extracts from input type (before transform)
extractFieldFromSchema({ schema, name: "name" }); // ZodString
extractFieldFromSchema({ schema, name: "age" }); // ZodNumber
```

---

### `extendWithMeta(field, transform)`

Extends a Zod field with a transformation while preserving its metadata.

```typescript
import { extendWithMeta } from "@zod-utils/core";
import { z } from "zod";

// Base field with metadata
const baseField = z.string().meta({ translationKey: "user.field.name" });

// Extend with validation while keeping metadata
const extendedField = extendWithMeta(baseField, (f) => f.min(3).max(100));

extendedField.meta(); // { translationKey: 'user.field.name' }
extendedField.parse("ab"); // throws - too short
extendedField.parse("abc"); // 'abc' - valid
```

#### Use Case: Shared Field Definitions with i18n

```typescript
// Shared field definitions with i18n metadata
const fields = {
  name: z.string().meta({ translationKey: "user.field.name" }),
  email: z.string().email().meta({ translationKey: "user.field.email" }),
  age: z.number().meta({ translationKey: "user.field.age" }),
};

// Create form uses base fields with additional constraints
const createFormSchema = z.object({
  name: extendWithMeta(fields.name, (f) => f.min(3).max(50)),
  email: extendWithMeta(fields.email, (f) => f.min(5)),
  age: extendWithMeta(fields.age, (f) => f.min(18).max(120)),
});

// Edit form uses same fields with different constraints
const editFormSchema = z.object({
  name: extendWithMeta(fields.name, (f) => f.optional()),
  email: fields.email, // no extension needed
  age: extendWithMeta(fields.age, (f) => f.optional()),
});
```

---

### `toFieldSelector(props)`

Extracts a `FieldSelector` from props containing schema, name, and optional discriminator. Encapsulates type assertion so callers don't need eslint-disable.

```typescript
import { toFieldSelector } from "@zod-utils/core";

const schema = z.object({ name: z.string(), age: z.number() });

const selector = toFieldSelector({ schema, name: "name" });
// { schema, name: 'name' }

// With discriminated union
const unionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("create"), title: z.string() }),
  z.object({ mode: z.literal("edit"), id: z.number() }),
]);

const unionSelector = toFieldSelector({
  schema: unionSchema,
  name: "title",
  discriminator: { key: "mode", value: "create" },
});
// { schema: unionSchema, name: 'title', discriminator: { key: 'mode', value: 'create' } }
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

### `Paths<T, FilterType?, Strict?>`

Generate dot-notation paths from any type. Low-level utility for building path strings.

#### Basic Usage

```typescript
import type { Paths } from "@zod-utils/core";

type User = {
  name: string;
  age: number;
  profile: {
    bio: string;
    avatar: string;
  };
  tags: string[];
};

// All paths
type AllPaths = Paths<User>;
// "name" | "age" | "profile" | "profile.bio" | "profile.avatar" | "tags" | "tags.0"
```

#### Filter by Type

```typescript
// Only string paths
type StringPaths = Paths<User, string>;
// "name" | "profile.bio" | "profile.avatar"

// Only number paths
type NumberPaths = Paths<User, number>;
// "age"
```

#### Strict vs Non-Strict Mode

```typescript
type Schema = {
  required: string;
  optional?: string;
  nullable: string | null;
};

// Strict mode (default) - exact type matching
type StrictPaths = Paths<Schema, string>;
// "required" - only exact string type

// Non-strict mode - includes optional/nullable
type LoosePaths = Paths<Schema, string, false>;
// "required" | "optional" | "nullable"
```

---

### `ValidPaths<TSchema, TDiscriminatorKey?, TDiscriminatorValue?, TFilterType?, TStrict?>`

Generates valid dot-notation paths for a Zod schema, with optional type filtering and discriminated union support.

#### Basic Usage

```typescript
import type { ValidPaths } from "@zod-utils/core";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().optional(),
  active: z.boolean(),
});

// All paths
type AllPaths = ValidPaths<typeof schema>;
// "name" | "age" | "email" | "active"
```

#### Filter by Type

```typescript
// Only string fields
type StringPaths = ValidPaths<typeof schema, never, never, string>;
// "name"

// Non-strict mode - includes optional string fields
type LooseStringPaths = ValidPaths<typeof schema, never, never, string, false>;
// "name" | "email"
```

#### With Discriminated Unions

```typescript
const formSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("create"), name: z.string(), age: z.number() }),
  z.object({ mode: z.literal("edit"), id: z.number(), title: z.string() }),
]);

// All paths for 'create' variant
type CreatePaths = ValidPaths<typeof formSchema, "mode", "create">;
// "mode" | "name" | "age"

// All paths for 'edit' variant
type EditPaths = ValidPaths<typeof formSchema, "mode", "edit">;
// "mode" | "id" | "title"

// Number paths for 'edit' variant
type EditNumberPaths = ValidPaths<typeof formSchema, "mode", "edit", number>;
// "id"

// String paths for 'create' variant (non-strict to include optional)
type CreateStringPaths = ValidPaths<typeof formSchema, "mode", "create", string, false>;
// "name"
```

#### Nested Objects

```typescript
const schema = z.object({
  user: z.object({
    profile: z.object({
      firstName: z.string(),
      lastName: z.string(),
      age: z.number(),
    }),
    settings: z.object({
      theme: z.string(),
      notifications: z.boolean(),
    }),
  }),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

// All paths including nested
type AllPaths = ValidPaths<typeof schema>;
// "user" | "user.profile" | "user.profile.firstName" | "user.profile.lastName" |
// "user.profile.age" | "user.settings" | "user.settings.theme" |
// "user.settings.notifications" | "metadata" | "metadata.createdAt" | "metadata.updatedAt"

// Only string paths (deeply nested)
type StringPaths = ValidPaths<typeof schema, never, never, string>;
// "user.profile.firstName" | "user.profile.lastName" | "user.settings.theme"

// Only boolean paths
type BooleanPaths = ValidPaths<typeof schema, never, never, boolean>;
// "user.settings.notifications"

// Only Date paths
type DatePaths = ValidPaths<typeof schema, never, never, Date>;
// "metadata.createdAt" | "metadata.updatedAt"
```

#### Arrays and Array Elements

```typescript
const schema = z.object({
  tags: z.array(z.string()),
  scores: z.array(z.number()),
  users: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().optional(),
    })
  ),
  matrix: z.array(z.array(z.number())),
});

// All paths - arrays use numeric index syntax
type AllPaths = ValidPaths<typeof schema>;
// "tags" | "tags.0" | "scores" | "scores.0" |
// "users" | "users.0" | "users.0.id" | "users.0.name" | "users.0.email" |
// "matrix" | "matrix.0" | "matrix.0.0"

// Array element paths only (filter by element type)
type StringArrayElements = ValidPaths<typeof schema, never, never, string>;
// "tags.0" | "users.0.name"

// Number array elements
type NumberArrayElements = ValidPaths<typeof schema, never, never, number>;
// "scores.0" | "users.0.id" | "matrix.0.0"

// The "0" is a placeholder - works with any numeric index at runtime
// These are all valid at runtime: "users.0.name", "users.1.name", "users.99.name"
```

#### Optional Nested Objects and Arrays

```typescript
const schema = z.object({
  // Required nested object
  profile: z.object({
    name: z.string(),
    age: z.number(),
  }),
  // Optional nested object
  settings: z
    .object({
      theme: z.string(),
      language: z.string(),
    })
    .optional(),
  // Nullable nested object
  metadata: z
    .object({
      source: z.string(),
      version: z.number(),
    })
    .nullable(),
  // Required array
  tags: z.array(z.string()),
  // Optional array
  scores: z.array(z.number()).optional(),
  // Nullable array of objects
  comments: z
    .array(
      z.object({
        author: z.string(),
        text: z.string(),
      })
    )
    .nullable(),
});

// All paths (no filter) - includes everything
type AllPaths = ValidPaths<typeof schema>;
// "profile" | "profile.name" | "profile.age" |
// "settings" | "settings.theme" | "settings.language" |
// "metadata" | "metadata.source" | "metadata.version" |
// "tags" | "tags.0" |
// "scores" | "scores.0" |
// "comments" | "comments.0" | "comments.0.author" | "comments.0.text"

// Strict mode - paths through optional/nullable parents are BLOCKED
type StrictStringPaths = ValidPaths<typeof schema, never, never, string>;
// "profile.name" | "tags.0"
// Note: settings.theme, metadata.source, comments.0.author are excluded
// because their parent objects are optional/nullable

// Non-strict mode - paths through optional/nullable parents are ALLOWED
type LooseStringPaths = ValidPaths<typeof schema, never, never, string, false>;
// "profile.name" | "settings.theme" | "settings.language" |
// "metadata.source" | "tags.0" | "comments.0.author" | "comments.0.text"

// Strict number paths
type StrictNumberPaths = ValidPaths<typeof schema, never, never, number>;
// "profile.age"
// Note: metadata.version and scores.0 are excluded (optional/nullable parents)

// Non-strict number paths
type LooseNumberPaths = ValidPaths<typeof schema, never, never, number, false>;
// "profile.age" | "metadata.version" | "scores.0"
```

#### When to Use Strict vs Non-Strict Mode

```typescript
// Strict mode (default): Use when you need GUARANTEED non-null values
// - Form fields that must always exist
// - Required input components
// - Direct property access without null checks

// Non-strict mode: Use when you handle optional/nullable at runtime
// - Conditional form fields
// - Fields that may or may not be rendered
// - When you already check for existence before accessing
```

#### Practical Example: Type-Safe Form Field Component

```typescript
const userFormSchema = z.object({
  personal: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    age: z.number().min(18),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  addresses: z.array(
    z.object({
      street: z.string(),
      city: z.string(),
      zipCode: z.string(),
    })
  ),
});

// Type-safe field component that only accepts valid paths
function TextField<TName extends ValidPaths<typeof userFormSchema, never, never, string>>({
  name,
}: {
  name: TName;
}) {
  // Implementation
}

// Usage - TypeScript provides autocomplete for all string paths:
<TextField name="personal.firstName" />  // ✅ Valid
<TextField name="personal.lastName" />   // ✅ Valid
<TextField name="contact.email" />       // ✅ Valid
<TextField name="addresses.0.street" />  // ✅ Valid
<TextField name="addresses.0.city" />    // ✅ Valid

// TypeScript errors:
<TextField name="personal.age" />        // ❌ Error: age is number, not string
<TextField name="invalid.path" />        // ❌ Error: path doesn't exist

// Number field component
function NumberField<TName extends ValidPaths<typeof userFormSchema, never, never, number>>({
  name,
}: {
  name: TName;
}) {
  // Implementation
}

<NumberField name="personal.age" />      // ✅ Valid - age is number
<NumberField name="personal.firstName" /> // ❌ Error: firstName is string
```

#### Optional and Nullable Fields with Strict Mode

```typescript
const schema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
  optionalNullable: z.string().optional().nullable(),
  withDefault: z.string().default("hello"),
});

// Strict mode (default) - only exact type matches
type StrictStringPaths = ValidPaths<typeof schema, never, never, string>;
// "required" | "withDefault"
// Note: optional/nullable are excluded because their type is string | undefined/null

// Non-strict mode - includes optional and nullable fields
type LooseStringPaths = ValidPaths<typeof schema, never, never, string, false>;
// "required" | "optional" | "nullable" | "optionalNullable" | "withDefault"
```

#### Complex Discriminated Union with Nested Arrays

```typescript
const orderSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("physical"),
    items: z.array(
      z.object({
        productId: z.number(),
        quantity: z.number(),
        price: z.number(),
      })
    ),
    shippingAddress: z.object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
    }),
  }),
  z.object({
    type: z.literal("digital"),
    items: z.array(
      z.object({
        productId: z.number(),
        licenseKey: z.string(),
        downloadUrl: z.string(),
      })
    ),
    email: z.string().email(),
  }),
]);

// Physical order paths
type PhysicalPaths = ValidPaths<typeof orderSchema, "type", "physical">;
// "type" | "items" | "items.0" | "items.0.productId" | "items.0.quantity" |
// "items.0.price" | "shippingAddress" | "shippingAddress.street" |
// "shippingAddress.city" | "shippingAddress.country"

// Digital order string paths
type DigitalStringPaths = ValidPaths<typeof orderSchema, "type", "digital", string>;
// "items.0.licenseKey" | "items.0.downloadUrl" | "email"

// Physical order number paths (for numeric inputs)
type PhysicalNumberPaths = ValidPaths<typeof orderSchema, "type", "physical", number>;
// "items.0.productId" | "items.0.quantity" | "items.0.price"
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

### `DiscriminatedInput<TSchema, TDiscriminatorKey, TDiscriminatorValue>`

Extracts the input type from a discriminated union variant.

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

## Migration Guide

### Migrating to v3.0.0

#### `ValidPathsOfType` removed → Use `ValidPaths` with type filtering

```typescript
// Before (v2.x)
import type { ValidPathsOfType } from "@zod-utils/core";
type StringPaths = ValidPathsOfType<typeof schema, string>;
type EditNumberPaths = ValidPathsOfType<typeof schema, number, "mode", "edit">;

// After (v3.x)
import type { ValidPaths } from "@zod-utils/core";
type StringPaths = ValidPaths<typeof schema, never, never, string>;
type EditNumberPaths = ValidPaths<typeof schema, "mode", "edit", number>;
```

### Migrating to v4.0.0

#### `mergeFieldSelectorProps` renamed → Use `toFieldSelector`

```typescript
// Before (v3.x)
import { mergeFieldSelectorProps } from "@zod-utils/core";
const selectorProps = mergeFieldSelectorProps(
  { schema },
  { name, discriminator }
);

// After (v4.x)
import { toFieldSelector } from "@zod-utils/core";
const selectorProps = toFieldSelector({ schema, name, discriminator });
```

---

## License

MIT
