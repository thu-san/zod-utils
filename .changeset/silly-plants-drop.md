---
"@zod-utils/core": minor
"@zod-utils/react-hook-form": minor
---

Add recursive default extraction from nested objects

getSchemaDefaults and extractDefaultValue now recursively extract defaults
from nested ZodObject fields, even when the parent object doesn't have an
explicit .default() wrapper. Explicit .default() on objects still takes
precedence over recursive extraction.
