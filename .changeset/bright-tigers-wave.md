---
"@zod-utils/core": minor
"@zod-utils/react-hook-form": minor
---

Enhanced field extraction and validation utilities with union support:

- `extractFieldFromSchema` return type no longer includes `| undefined` when field definitely exists
- `ExtractZodUnionMember` type is now exported for public use
- `getFieldChecks` now supports union types (collects checks from all options)
- `getFieldChecks` now fully supports Zod v4 format types (ZodEmail, ZodURL, ZodUUID, etc.)
- `partialFields` preserves structural type info for better `.shape` access

Comprehensive test coverage added for 4 patterns: normal schema, schema with transform, discriminated union, and discriminated union with transform.
