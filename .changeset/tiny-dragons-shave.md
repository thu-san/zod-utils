---
"@zod-utils/react-hook-form": minor
"@zod-utils/core": minor
---

Add schema meta utilities: `extractMeta` for extracting meta values
from individual fields, `getSchemaMeta` for extracting meta from
entire schemas, and `getMergedSchemaDefaults` for combining schema
defaults with meta values (meta wins on conflict). Add React hooks
`useGetSchemaDefaults`, `useGetSchemaMeta`, and
`useGetMergedSchemaDefaults` for memoized usage in components.
