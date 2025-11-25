---
"@zod-utils/react-hook-form": minor
"@zod-utils/core": minor
---

Add transform support to schema utilities

- `getSchemaDefaults`, `extractFieldFromSchema`, and
  `extractDefaultValue` now correctly handle schemas
  with `.transform()`
- Unwraps transforms via `getPrimitiveType()` to
  extract fields and defaults from the input type
- Schemas like `z.object({...}).transform(...)` now
  work seamlessly
