# @zod-utils/react-hook-form

[![npm version](https://img.shields.io/npm/v/@zod-utils/react-hook-form.svg)](https://www.npmjs.com/package/@zod-utils/react-hook-form)
[![npm downloads](https://img.shields.io/npm/dm/@zod-utils/react-hook-form.svg)](https://www.npmjs.com/package/@zod-utils/react-hook-form)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@zod-utils/react-hook-form)](https://bundlephobia.com/package/@zod-utils/react-hook-form)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/thu-san/zod-utils/workflows/CI/badge.svg)](https://github.com/thu-san/zod-utils/actions)
[![codecov](https://codecov.io/gh/thu-san/zod-utils/branch/main/graph/badge.svg?flag=react-hook-form)](https://codecov.io/gh/thu-san/zod-utils)

React Hook Form integration and utilities for Zod schemas.

## 💡 Why Use This?

**The whole point:** Automatically transforms your Zod schema types so form inputs accept `undefined` (and `null` for objects only) during editing, while the validated output remains exactly as your Zod schema defines.

No more type wrestling with React Hook Form - just pass your schema and it works.

```typescript
import { useZodForm } from "@zod-utils/react-hook-form";
import { z } from "zod";

// Your schema with primitives, arrays, and objects - NOT optional
const schema = z.object({
  username: z.string().min(3),
  age: z.number().min(18),
  tags: z.array(z.string()),
  profile: z.object({ bio: z.string() }),
});

const form = useZodForm({ schema });

// ✅ Works! Primitives and arrays accept undefined during editing
form.setValue("username", undefined);
form.setValue("age", undefined);
form.setValue("tags", undefined);

// ✅ Works! Objects accept both null and undefined
form.setValue("profile", null);
form.setValue("profile", undefined);

// ✅ Validated output type is exactly z.infer<typeof schema>
const onSubmit = form.handleSubmit((data) => {
  // Type: { username: string; age: number; tags: string[]; profile: { bio: string } }
  // NOT { username: string | null | undefined; ... }
  console.log(data.username); // Type: string
  console.log(data.age); // Type: number
  console.log(data.tags); // Type: string[]
  console.log(data.profile); // Type: { bio: string }
});
```

## Installation

```bash
npm install @zod-utils/react-hook-form zod react react-hook-form @hookform/resolvers
```

## Related Packages

- **[@zod-utils/core](https://www.npmjs.com/package/@zod-utils/core)** - Pure TypeScript utilities for Zod schema manipulation (no React dependencies). All utilities are re-exported from this package for convenience.

## Features

- 🎣 **useZodForm** - Automatic type transformation for form inputs (nullable/undefined) while preserving Zod schema validation
- 📦 **All core utilities** - Re-exports everything from `@zod-utils/core`
- ⚛️ **React-optimized** - Built specifically for React applications

## Quick Start

```typescript
import { useZodForm, getSchemaDefaults } from "@zod-utils/react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().default("John Doe"),
  email: z.string().email(),
  age: z.number().min(18),
});

function MyForm() {
  const form = useZodForm({
    schema,
    defaultValues: getSchemaDefaults(schema),
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...form.register("name")} />
      <input {...form.register("email")} type="email" />
      <input {...form.register("age")} type="number" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## API Reference

### `useZodForm(config)`

Type-safe wrapper around React Hook Form's `useForm` with automatic Zod schema integration.

```typescript
import { useZodForm } from "@zod-utils/react-hook-form";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

const form = useZodForm({
  schema, // Zod schema (required)
  defaultValues: {
    /* ... */
  }, // Optional default values
  zodResolverOptions: {
    /* ... */
  }, // Optional zodResolver options
  // ... all other useForm options
});
```

**What it does:**

- **Input transformation** (by default):
  - **Primitive fields** (string, number, boolean) accept `undefined` only
  - **Array fields** accept `undefined` only
  - **Object fields** accept both `null` and `undefined`
  - You can override this by specifying a custom input type (see examples below)
- **Output validation**: Validated data matches your Zod schema exactly
- **Type inference**: No manual type annotations needed - everything is inferred from the schema
- **Zod integration**: Automatically sets up `zodResolver` for validation

#### Custom Input Types

You can override the default input type transformation if needed:

```typescript
import {
  useZodForm,
  PartialWithAllNullables,
} from "@zod-utils/react-hook-form";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number(),
});

// Option 1: Use PartialWithAllNullables to make ALL fields accept null
const form = useZodForm<
  z.infer<typeof schema>,
  PartialWithAllNullables<z.infer<typeof schema>>
>({
  schema,
  defaultValues: { username: null, email: null, age: null },
});

// Option 2: Specify exact input types per field
const form2 = useZodForm<
  z.infer<typeof schema>,
  {
    username?: string | null; // Can be set to null
    email?: string; // Can only be undefined
    age?: number | null; // Can be set to null
  }
>({
  schema,
  defaultValues: { username: null, email: undefined, age: null },
});
```

---

## Core Utilities (Re-exported)

All utilities from `@zod-utils/core` are re-exported for convenience:

```typescript
import {
  // Schema utilities (from @zod-utils/core)
  getSchemaDefaults,
  requiresValidInput,
  getPrimitiveType,
  removeDefault,
  extractDefault,
  type Simplify,

  // Type utilities (react-hook-form specific)
  type PartialWithNullableObjects,
  type PartialWithAllNullables,
} from "@zod-utils/react-hook-form";
```

See [@zod-utils/core documentation](../core/README.md) for details on schema utilities.

### Type Utilities

#### `PartialWithNullableObjects<T>`

Transforms properties based on their type. Primitive and array fields become optional-only (not nullable), while object fields become optional and nullable.

**Transformation rules:**

- **Primitives** (string, number, boolean): optional → `type | undefined`
- **Arrays**: optional → `type[] | undefined`
- **Objects**: optional and nullable → `type | null | undefined`

```typescript
import type { PartialWithNullableObjects } from "@zod-utils/react-hook-form";

type User = {
  name: string;
  age: number;
  tags: string[];
  profile: { bio: string };
};

type FormInput = PartialWithNullableObjects<User>;
// {
//   name?: string;                  // Primitive: optional, not nullable
//   age?: number;                   // Primitive: optional, not nullable
//   tags?: string[];                // Array: optional, not nullable
//   profile?: { bio: string } | null; // Object: optional AND nullable
// }
```

This type is used internally by `useZodForm` to allow form fields to accept undefined (and null for objects only) during editing while maintaining proper validation types.

#### `PartialWithAllNullables<T>`

Makes all fields optional and nullable, regardless of type.

**Transformation rules:**

- **All fields**: optional and nullable → `type | null | undefined`

```typescript
import type { PartialWithAllNullables } from "@zod-utils/react-hook-form";

type User = {
  name: string;
  age: number;
  tags: string[];
};

type FormInput = PartialWithAllNullables<User>;
// {
//   name?: string | null;       // All fields: optional AND nullable
//   age?: number | null;        // All fields: optional AND nullable
//   tags?: string[] | null;     // All fields: optional AND nullable
// }
```

Use this when all fields need to accept `null`, not just objects/arrays.

---

## Complete Example

```typescript
import { useZodForm, getSchemaDefaults } from "@zod-utils/react-hook-form";
import { z } from "zod";

const userSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    age: z.number().min(18).max(120),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  preferences: z.object({
    theme: z.enum(["light", "dark"]).default("light"),
    notifications: z.boolean().default(true),
  }),
});

function UserForm() {
  const form = useZodForm({
    schema: userSchema,
    defaultValues: getSchemaDefaults(userSchema),
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log("Valid data:", data);
  });

  return (
    <form onSubmit={onSubmit}>
      {/* Profile */}
      <input {...form.register("profile.firstName")} />
      {form.formState.errors.profile?.firstName && (
        <span>{form.formState.errors.profile.firstName.message}</span>
      )}

      <input {...form.register("profile.lastName")} />
      {form.formState.errors.profile?.lastName && (
        <span>{form.formState.errors.profile.lastName.message}</span>
      )}

      <input
        {...form.register("profile.age", { valueAsNumber: true })}
        type="number"
      />
      {form.formState.errors.profile?.age && (
        <span>{form.formState.errors.profile.age.message}</span>
      )}

      {/* Contact */}
      <input {...form.register("contact.email")} type="email" />
      {form.formState.errors.contact?.email && (
        <span>{form.formState.errors.contact.email.message}</span>
      )}

      <input {...form.register("contact.phone")} type="tel" />

      {/* Preferences - pre-filled with defaults */}
      <select {...form.register("preferences.theme")}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>

      <label>
        <input
          {...form.register("preferences.notifications")}
          type="checkbox"
        />
        Enable notifications
      </label>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## TypeScript Support

Fully typed with TypeScript for the best developer experience:

```typescript
const form = useZodForm({
  schema: userSchema,
  defaultValues: getSchemaDefaults(userSchema),
});

// ✅ Fully typed
form.register("profile.firstName");

// ❌ TypeScript error
form.register("nonexistent.field");
```

---

## License

MIT
