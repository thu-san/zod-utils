# @zod-utils/react-hook-form

[![npm version](https://img.shields.io/npm/v/@zod-utils/react-hook-form.svg)](https://www.npmjs.com/package/@zod-utils/react-hook-form)
[![npm downloads](https://img.shields.io/npm/dm/@zod-utils/react-hook-form.svg)](https://www.npmjs.com/package/@zod-utils/react-hook-form)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/thu-san/zod-utils/workflows/CI/badge.svg)](https://github.com/thu-san/zod-utils/actions)
[![codecov](https://codecov.io/gh/thu-san/zod-utils/branch/main/graph/badge.svg?flag=react-hook-form)](https://codecov.io/gh/thu-san/zod-utils)

React Hook Form integration and utilities for Zod schemas.

## 💡 Why Use This?

**The whole point:** Automatically transforms your Zod schema types so form inputs and default values accept `null | undefined` during editing, while the validated output remains exactly as your Zod schema defines.

No more type wrestling with React Hook Form - just pass your schema and it works.

```typescript
import { useZodForm } from "@zod-utils/react-hook-form";
import { z } from "zod";

// Your schema requires string - NOT optional
const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

const form = useZodForm({ schema });

// ✅ Works! defaultValues accepts null/undefined during editing
form.reset({ username: null, email: undefined });

// ✅ Works! setValue accepts null/undefined during editing
form.setValue("username", null);
form.setValue("email", undefined);

// ✅ Validated output type is exactly z.infer<typeof schema>
const onSubmit = form.handleSubmit((data) => {
  // Type: { username: string; email: string }
  // NOT { username: string | null | undefined; email: string | null | undefined }
  console.log(data.username); // Type: string
  console.log(data.email); // Type: string
});
```

## Installation

```bash
npm install @zod-utils/react-hook-form zod react react-hook-form @hookform/resolvers
```

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

- **Input transformation**: Form field values can be `null` or `undefined` during editing
- **Output validation**: Validated data matches your Zod schema exactly
- **Type inference**: No manual type annotations needed - everything is inferred from the schema
- **Zod integration**: Automatically sets up `zodResolver` for validation

---

## Core Utilities (Re-exported)

All utilities from `@zod-utils/core` are re-exported for convenience:

```typescript
import {
  // Schema utilities (from @zod-utils/core)
  getSchemaDefaults,
  checkIfFieldIsRequired,
  getPrimitiveType,
  removeDefault,
  extractDefault,
  type Simplify,

  // Type utilities (react-hook-form specific)
  type MakeOptionalAndNullable,
} from "@zod-utils/react-hook-form";
```

See [@zod-utils/core documentation](../core/README.md) for details on schema utilities.

### Type Utilities

#### `MakeOptionalAndNullable<T>`

Make all properties optional and nullable. Useful for React Hook Form input types where fields can be empty during editing.

```typescript
import type { MakeOptionalAndNullable } from "@zod-utils/react-hook-form";

type User = {
  name: string;
  age: number;
};

type FormInput = MakeOptionalAndNullable<User>;
// { name?: string | null; age?: number | null; }
```

This type is used internally by `useZodForm` to allow form fields to be null/undefined during editing while maintaining proper validation types.

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
