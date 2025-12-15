---
"@zod-utils/react-hook-form": major
"@zod-utils/core": major
---

Rename selector utility functions with simplified API

- Rename `mergeFieldSelectorProps` to `toFieldSelector` in @zod-utils/core
- Rename `mergeFormFieldSelectorProps` to `toFormFieldSelector` in @zod-utils/react-hook-form
- New API accepts a single props object `{ schema, name, discriminator? }` instead of two separate objects
