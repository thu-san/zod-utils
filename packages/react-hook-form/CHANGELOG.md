# @zod-utils/react-hook-form

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
