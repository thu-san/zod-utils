# @zod-utils/react-hook-form

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
