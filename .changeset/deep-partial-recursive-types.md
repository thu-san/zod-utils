---
"@zod-utils/core": minor
"@zod-utils/react-hook-form": minor
---

Add recursive deep partial type transformation for form inputs

- **New types**: `DeepPartialWithNullableObjects<T>` and `DeepPartialWithAllNullables<T>` - recursively transform nested object properties to be optional
- **Deprecation**: `PartialWithNullableObjects` and `PartialWithAllNullables` are now deprecated aliases (backward compatible)
- **Fix**: Nested fields with `useWatch` and `useFormContext` now correctly typed as `T | undefined` at any nesting depth
- **Built-in types preserved**: Date, RegExp, Map, Set, WeakMap, WeakSet, Promise, Error are not recursively transformed

### Breaking Change (Type-level only)

If you were relying on nested object properties being typed as required (the previous incorrect behavior), you may need to update your code. The new behavior correctly reflects that form fields are `undefined` until values are set.

### Migration

No code changes required. Old type names still work but will show deprecation warnings in editors:

```typescript
// Before (still works, but deprecated)
type FormInput = PartialWithNullableObjects<MySchema>;

// After (recommended)
type FormInput = DeepPartialWithNullableObjects<MySchema>;
```
