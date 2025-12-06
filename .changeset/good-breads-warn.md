---
"@zod-utils/react-hook-form": patch
"@zod-utils/core": patch
---

- New `DiscriminatedInput` type helper for extracting input
  types from discriminated union variants
- New `ValidPathsOfType` type for filtering schema paths by
  value type (e.g., get all `number` paths)
- New `ValidFieldPathsOfType` type for React Hook Form
  integration
- Refactored `ValidPaths` to use shared `DiscriminatedInput`
  helper
