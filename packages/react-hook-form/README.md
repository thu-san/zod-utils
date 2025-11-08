# @zod-utils/react-hook-form


[![npm version](https://img.shields.io/npm/v/@zod-utils/react-hook-form.svg)](https://www.npmjs.com/package/@zod-utils/react-hook-form)
[![npm downloads](https://img.shields.io/npm/dm/@zod-utils/react-hook-form.svg)](https://www.npmjs.com/package/@zod-utils/react-hook-form)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/thu-san/zod-utils/workflows/CI/badge.svg)](https://github.com/thu-san/zod-utils/actions)
React Hook Form integration and utilities for Zod schemas.

## Installation

```bash
npm install @zod-utils/react-hook-form zod react react-hook-form @hookform/resolvers
```

## Features

- 🎣 **useZodForm** - Type-safe React Hook Form integration
- 🌐 **Custom error messages** - Japanese error resolver (customizable)
- 📦 **All core utilities** - Re-exports everything from `@zod-utils/core`
- ⚛️ **React-optimized** - Built specifically for React applications

## Quick Start

```typescript
import { useZodForm, getSchemaDefaults } from '@zod-utils/react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().default('John Doe'),
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
      <input {...form.register('name')} />
      <input {...form.register('email')} type="email" />
      <input {...form.register('age')} type="number" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## API Reference

### `useZodForm(config)`

Type-safe wrapper around React Hook Form's `useForm` with automatic Zod schema integration.

```typescript
import { useZodForm } from '@zod-utils/react-hook-form';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

const form = useZodForm({
  schema,                          // Zod schema (required)
  defaultValues: { /* ... */ },    // Optional default values
  zodResolverOptions: { /* ... */ }, // Optional zodResolver options
  // ... all other useForm options
});
```

**Automatically sets up:**
- Zod schema validation via `zodResolver`
- Proper TypeScript typing
- Form state management

---

### `customErrorResolver(config)`

Custom error message resolver with Japanese translations. Easily customizable for other languages.

```typescript
import { customErrorResolver, FieldNamespaceMapping } from '@zod-utils/react-hook-form';
import { z } from 'zod';

// Extend the field namespace mapping
const MyFieldNamespaceMapping = {
  ...FieldNamespaceMapping,
  myForm: {
    username: 'ユーザー名',
    email: 'メールアドレス',
  },
};

const errorMap = customErrorResolver({
  fieldNamespace: 'myForm',
});

const schema = z.object({
  username: z.string(),
  email: z.string().email(),
});

// Use with Zod
schema.parse({ username: '', email: 'invalid' }, { errorMap });
```

**Supported error types:**
- `too_small` / `too_big` - With field-specific messages
- `invalid_type` - Type mismatch errors
- `invalid_format` - Email, URL, UUID, etc.
- `invalid_value` - Enum/literal errors
- And more...

---

### `FieldNamespaceMapping`

Mapping object for custom field names in error messages.

```typescript
export const FieldNamespaceMapping = {
  department: {
    groupName: '部署・店舗名',
  },
  // Add your own namespaces
};

export type FIELD_NAMESPACE = keyof typeof FieldNamespaceMapping;
```

**Extend it:**
```typescript
import { FieldNamespaceMapping } from '@zod-utils/react-hook-form';

const CustomMapping = {
  ...FieldNamespaceMapping,
  userForm: {
    firstName: '名',
    lastName: '姓',
  },
};
```

---

## Core Utilities (Re-exported)

All utilities from `@zod-utils/core` are re-exported for convenience:

```typescript
import {
  // Schema utilities
  getSchemaDefaults,
  checkIfFieldIsRequired,
  getPrimitiveType,
  removeDefault,
  extractDefault,
  getUnwrappedType,

  // Type utilities
  type MakeOptionalAndNullable,
  type Simplify,
  type PickArrayObject,
} from '@zod-utils/react-hook-form';
```

See [@zod-utils/core documentation](../core/README.md) for details.

---

## Complete Example

```typescript
import { useZodForm, getSchemaDefaults } from '@zod-utils/react-hook-form';
import { z } from 'zod';

const userSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    age: z.number().min(18).max(120),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true),
  }),
});

function UserForm() {
  const form = useZodForm({
    schema: userSchema,
    defaultValues: getSchemaDefaults(userSchema),
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log('Valid data:', data);
  });

  return (
    <form onSubmit={onSubmit}>
      {/* Profile */}
      <input {...form.register('profile.firstName')} />
      {form.formState.errors.profile?.firstName && (
        <span>{form.formState.errors.profile.firstName.message}</span>
      )}

      <input {...form.register('profile.lastName')} />
      {form.formState.errors.profile?.lastName && (
        <span>{form.formState.errors.profile.lastName.message}</span>
      )}

      <input {...form.register('profile.age', { valueAsNumber: true })} type="number" />
      {form.formState.errors.profile?.age && (
        <span>{form.formState.errors.profile.age.message}</span>
      )}

      {/* Contact */}
      <input {...form.register('contact.email')} type="email" />
      {form.formState.errors.contact?.email && (
        <span>{form.formState.errors.contact.email.message}</span>
      )}

      <input {...form.register('contact.phone')} type="tel" />

      {/* Preferences - pre-filled with defaults */}
      <select {...form.register('preferences.theme')}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>

      <label>
        <input
          {...form.register('preferences.notifications')}
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
form.register('profile.firstName');

// ❌ TypeScript error
form.register('nonexistent.field');
```

---

## License

MIT
