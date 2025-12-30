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

2. **Clarification on `TFilterType` default**

   In the core type utilities (e.g. `ValidPaths`), the `TFilterType` generic **still defaults to `unknown`**. This means existing usages that relied on `TFilterType = unknown` remain valid and unchanged.

   The recent changes only affect the default value types for the form field components (`InputFormField`, `NumberFormField`, `CheckboxFormField`), which now default to their respective primitive types (`string`, `number`, `boolean`). This does **not** alter the `TFilterType` default in `@zod-utils/core`.

   If you prefer to be explicit about the `TFilterType` default when using core utilities, you can continue to specify it as `unknown`:

   ```ts
   // Explicitly specifying TFilterType as `unknown`
   type Paths = ValidPaths<MySchema, unknown>;
   ```

   This clarification is intended to avoid confusion: there is no breaking change to the `TFilterType` default in the core types.

3. **`TStrict` behavior for form field components**

   The core type utilities (e.g. `ValidPaths`) still default `TStrict` to `true` (strict mode), but the React form field components now opt into `TStrict = false` (non-strict mode) by default when they use these utilities.

   - If you relied on strict mode being enabled by default for form field components, you must now opt into it explicitly in your component usage.
   - To preserve the old strict behavior, pass `TStrict = true` explicitly via the appropriate generic parameter or configuration on these components.

   Review your usages of form field components and related utilities to confirm that the new non-strict behavior and primitive `TFilterType` default match your expectations.

4. **Generic parameter renames (`FilterType` → `TFilterType`, `Strict` → `TStrict`)**

   The generic parameter names for `ValidPaths` (and related utilities) have been updated to follow the `T*` naming convention:

   - `FilterType` has been renamed to `TFilterType`
   - `Strict` has been renamed to `TStrict`

   If you were specifying generic arguments by parameter name in your own types, you must update those references:

   ```ts
   // Before – using old generic parameter names
   type MyPaths = ValidPaths<MySchema, FilterType, Strict>;

   // After – updated to new generic parameter names
   type MyPaths = ValidPaths<MySchema, TFilterType, TStrict>;
   ```

   This change is purely at the type parameter name level, but it is breaking for code that references the generic parameters by name.
