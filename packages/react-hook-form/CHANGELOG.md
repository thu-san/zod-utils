# @zod-utils/react-hook-form

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
