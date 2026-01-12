---
"@zod-utils/core": patch
"@zod-utils/react-hook-form": patch
---

Fix PartialFields brand type compatibility with z.infer

The PartialFields brand type was causing TypeScript errors when using z.infer on schemas wrapped with partialFields():

```
Type '{ hotel: string }' is not assignable to type 'PartialFields<{ hotel: string }>'.
Property '[FormInputBrand]' is missing...
```

Fixed by making the brand property optional with a unique symbol type and using bidirectional extends check for detection. This allows z.infer to work correctly while still enabling compile-time brand detection.
