---
"@zod-utils/core": major
"@zod-utils/react-hook-form": major
---

BREAKING: PartialWithNullableObjects and PartialWithAllNullables are now non-recursive by default

Nested object fields now stay strict instead of being recursively made partial. This is more appropriate for forms where nested objects often come from selectors/dropdowns and should be complete when provided.

To opt-in to partial transformation for specific nested objects, use the new `partialFields()` helper:

```typescript
import { partialFields } from '@zod-utils/react-hook-form';

const schema = z.object({
  // User input - opt-in to partial
  detail: partialFields(z.object({ hotel: z.string(), nights: z.number() })),
  // From selector - stays strict
  agent: z.object({ name: z.string(), fee: z.number() }),
});
```

Removed:
- `DeepPartialWithNullableObjects` (use `PartialWithNullableObjects` + `partialFields()`)
- `DeepPartialWithAllNullables` (use `PartialWithAllNullables` + `partialFields()`)
