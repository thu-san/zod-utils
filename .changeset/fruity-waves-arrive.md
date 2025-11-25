---
"@zod-utils/core": major
"@zod-utils/react-hook-form": minor
---

**Breaking Changes:**
- `extractDiscriminatedSchema`: Changed parameter names from `discriminatorField`/`discriminatorValue` to `key`/`value`
- `getSchemaDefaults`: Changed discriminator option from `{ field, value }` to `{ key, value }`

**New Features:**
- Added `extractFieldFromSchema` function for extracting individual fields from schemas
- Enhanced type narrowing for discriminated unions with new `ExtractZodUnionMember` utility type
- Support for `z.ZodUnion` in addition to `z.ZodDiscriminatedUnion`
