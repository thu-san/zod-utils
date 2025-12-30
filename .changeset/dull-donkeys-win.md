---
"@zod-utils/react-hook-form": major
"@zod-utils/core": major
---

### @zod-utils/core

- Enhanced type exports and type checking improvements
- Comprehensive README documentation with copy-paste examples for all APIs
- Added extensive examples for `ValidPaths` type utility including:
  - Discriminated unions
  - Nested objects and arrays
  - Optional/nullable field handling
  - Strict vs non-strict mode path filtering

### @zod-utils/react-hook-form

- Updated dependency on @zod-utils/core

### Breaking Changes

1. **Default type parameters for form field components**

   The default generic type parameters for `InputFormField`, `NumberFormField`, and `CheckboxFormField` have changed.

   - If you previously relied on the implicit defaults (i.e. did not pass generic parameters), your TypeScript types may now change or produce new errors.
   - To preserve the old behavior, explicitly specify the generic type parameters on these components to match the value and field types you were previously using.

   ```ts
   // Before – relying on old defaults
   <InputFormField name="age" control={control} />

   // After – explicitly preserve previous types
   <InputFormField<number /* value type */>
     name="age"
     control={control}
   />
   ```

2. **`TFilterType` default changed from `unknown`**

   The `TFilterType` generic default has changed from `unknown` to a union of primitive filterable types (`string | number | boolean`).

   - If you depended on `TFilterType` being `unknown` (for fully untyped/opaque paths), you now need to pass `TFilterType` explicitly.
   - To keep the old behavior, update your usages to specify `TFilterType = unknown` explicitly:

   ```ts
   // Before – TFilterType defaulted to `unknown`
   type Paths = ValidPaths<MySchema>;

   // After – explicitly request the old default behavior
   type Paths = ValidPaths<MySchema, unknown>;
   ```

3. **`TStrict` default changed from `true` to `false`**

   The `TStrict` generic default has changed from `true` (strict mode) to `false` (non-strict mode).

   - If you relied on strict mode being enabled by default, you must now opt into it explicitly.
   - To preserve the old strict behavior, pass `TStrict = true` explicitly wherever you use this generic:

   ```ts
   // Before – strict mode was the default
   type StrictPaths = ValidPaths<MySchema>;

   // After – explicitly enable strict mode
   type StrictPaths = ValidPaths<MySchema, string | number | boolean, true>;
   ```

   Review your usages of `ValidPaths` and related utilities to confirm that the new non-strict default and primitive `TFilterType` default match your expectations.
