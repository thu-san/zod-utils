# @zod-utils/react-hook-form

## 6.0.1

### Patch Changes

- 9a8bcb6: Fix unstable useMemo dependency array in flattenFieldSelector

  Object.values() with spread operators produced arrays of varying sizes depending on which properties existed, causing React useMemo hooks to incorrectly detect dependency changes. Now returns a fixed 4-element array with explicit properties for stable memoization.

- Updated dependencies [9a8bcb6]
  - @zod-utils/core@6.0.1

## 6.0.0

### Major Changes

- 7a2fe2e: BREAKING: Refactor type utilities and field selector pattern

  - Rename `Discriminator` to `DiscriminatorProps` for clearer conditional prop typing
  - Remove `toFieldSelector` helper - use `FieldSelectorProps` type directly instead
  - Add new composable prop types: `SchemaProps`, `SchemaAndDiscriminatorProps`, `NameProps`, `NameAndDiscriminatorProps`, `FieldSelectorProps`
  - Add `IsDiscriminatedUnion` type utility for conditional discriminator requirements

  Migration:

  - Replace `Discriminator<Schema, Key, Value>` with `DiscriminatorProps<Schema, Key, Value>`
  - Replace `toFieldSelector(props)` with direct usage of `FieldSelectorProps` type in generic constraints

### Patch Changes

- Updated dependencies [7a2fe2e]
  - @zod-utils/core@6.0.0

## 5.0.0

### Major Changes

- dd9fa75: ### @zod-utils/core

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

### Patch Changes

- Updated dependencies [dd9fa75]
  - @zod-utils/core@5.0.0

## 4.0.0

### Major Changes

- 4fac71d: Rename selector utility functions with simplified API

  - Rename `mergeFieldSelectorProps` to `toFieldSelector` in @zod-utils/core
  - Rename `mergeFormFieldSelectorProps` to `toFormFieldSelector` in @zod-utils/react-hook-form
  - New API accepts a single props object `{ schema, name, discriminator? }` instead of two separate objects

### Patch Changes

- Updated dependencies [4fac71d]
  - @zod-utils/core@4.0.0

## 3.0.0

### Major Changes

- a91df55: BREAKING: Consolidate ValidPathsOfType into ValidPaths with type filtering

  - **BREAKING**: Remove `ValidPathsOfType` - use `ValidPaths` with 4th type parameter (`TFilterType`) instead
  - **BREAKING**: Remove `ValidFieldPathsOfType` - use `ValidFieldPaths` with 5th type parameter (`TFilterType`) instead
  - Add `FieldSelector` type for building type-safe form field components
  - Add `FormFieldSelector` type for React Hook Form integration
  - Add `mergeFormFieldSelectorProps` utility for form field component factories
  - Add `flattenFieldSelector` utility for React dependency array optimization
  - Add `Paths<T, FilterType?, Strict?>` with optional type filtering
  - Improve `ArrayPaths` and `DiscriminatedInput` typings for discriminated unions

  Migration:

  - `ValidPathsOfType<Schema, string>` → `ValidPaths<Schema, never, never, string>`
  - `ValidFieldPathsOfType<Schema, number>` → `ValidFieldPaths<Schema, never, never, never, number>`

### Patch Changes

- Updated dependencies [a91df55]
  - @zod-utils/core@3.0.0

## 2.0.2

### Patch Changes

- 227068e: - New `DiscriminatedInput` type helper for extracting input
  types from discriminated union variants
  - New `ValidPathsOfType` type for filtering schema paths by
    value type (e.g., get all `number` paths)
  - New `ValidFieldPathsOfType` type for React Hook Form
    integration
  - Refactored `ValidPaths` to use shared `DiscriminatedInput`
    helper
- Updated dependencies [227068e]
  - @zod-utils/core@2.0.2

## 2.0.1

### Patch Changes

- 5fdf8b7: Make schema and name optional in useIsRequiredField hook and improve useZodForm type inference for defaultValues
- Updated dependencies [5fdf8b7]
  - @zod-utils/core@2.0.1

## 2.0.0

### Major Changes

- fe54a4b: Add type-safe field path intellisense with ValidPaths/ValidFieldPaths types, add extendWithMeta for preserving metadata during field transformations, add useFieldChecks and useExtractFieldFromSchema hooks

  BREAKING CHANGE: Renamed `path` parameter to `name` in extractFieldFromSchema, useIsRequiredField, isRequiredField, useExtractFieldFromSchema, and useFieldChecks for React Hook Form API consistency

### Patch Changes

- Updated dependencies [fe54a4b]
  - @zod-utils/core@2.0.0

## 0.12.0

### Minor Changes

- 4cd876c: improve discriminator type utilities

### Patch Changes

- Updated dependencies [4cd876c]
  - @zod-utils/core@1.2.0

## 0.11.0

### Minor Changes

- b1aa720: Add transform support to schema utilities

  - `getSchemaDefaults`, `extractFieldFromSchema`, and
    `extractDefaultValue` now correctly handle schemas
    with `.transform()`
  - Unwraps transforms via `getPrimitiveType()` to
    extract fields and defaults from the input type
  - Schemas like `z.object({...}).transform(...)` now
    work seamlessly

### Patch Changes

- Updated dependencies [b1aa720]
  - @zod-utils/core@1.1.0

## 0.10.0

### Minor Changes

- 0307d9a: **Breaking Changes:**

  - `extractDiscriminatedSchema`: Changed parameter names from `discriminatorField`/`discriminatorValue` to `key`/`value`
  - `getSchemaDefaults`: Changed discriminator option from `{ field, value }` to `{ key, value }`

  **New Features:**

  - Added `extractFieldFromSchema` function for extracting individual fields from schemas
  - Enhanced type narrowing for discriminated unions with new `ExtractZodUnionMember` utility type
  - Support for `z.ZodUnion` in addition to `z.ZodDiscriminatedUnion`

### Patch Changes

- Updated dependencies [0307d9a]
  - @zod-utils/core@1.0.0

## 0.9.0

### Minor Changes

- 9d0f867: handle discriminated union

### Patch Changes

- Updated dependencies [9d0f867]
  - @zod-utils/core@0.9.0

## 0.8.0

### Minor Changes

- 23b3073: Fix form input type when default values exists

### Patch Changes

- Updated dependencies [23b3073]
  - @zod-utils/core@0.8.0

## 0.7.0

### Minor Changes

- 9ee5512: Fix bug where form input doesn't become optional if defaultValues is not defined

### Patch Changes

- Updated dependencies [9ee5512]
  - @zod-utils/core@0.7.0

## 0.6.0

### Minor Changes

- 0fa9e36: Fix import and update demo

### Patch Changes

- Updated dependencies [0fa9e36]
  - @zod-utils/core@0.6.0

## 0.5.0

### Minor Changes

- 900bfa3: Add getFieldChecks to show validation rules as descriptions

### Patch Changes

- Updated dependencies [900bfa3]
  - @zod-utils/core@0.5.0

## 0.4.0

### Minor Changes

- 8ceaa30: Rework requireValidInput
- 7e499b4: **BREAKING CHANGE:** Renamed `checkIfFieldIsRequired` to `requiresValidInput`

  The function has been renamed to better reflect its purpose: determining if a field will show validation errors when the user submits empty or invalid input. This is a breaking change for anyone using the old function name.

  **Migration:**

  ```diff
  - import { checkIfFieldIsRequired } from '@zod-utils/core';
  + import { requiresValidInput } from '@zod-utils/core';

  - const isRequired = checkIfFieldIsRequired(schema);
  + const isRequired = requiresValidInput(schema);
  ```

  **Improvements:**

  - Clearer function name that reflects form validation context
  - Comprehensive documentation with real-world examples
  - Emphasis on key insight: defaults are initial values, not validation bypasses
  - All tests and documentation updated

  **Behavior:** The function logic remains unchanged - only the name and documentation have been updated.

### Patch Changes

- Updated dependencies [8ceaa30]
- Updated dependencies [7e499b4]
  - @zod-utils/core@0.4.0

## 0.3.0

### Minor Changes

- ac2315d: update inputType and make it Generic

## 0.2.0

### Minor Changes

- 632c391: MVP

### Patch Changes

- Updated dependencies [632c391]
  - @zod-utils/core@0.2.0
