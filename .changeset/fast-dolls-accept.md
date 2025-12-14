---
"@zod-utils/react-hook-form": major
"@zod-utils/core": major
---

BREAKING: Consolidate ValidPathsOfType into ValidPaths with type filtering

- **BREAKING**: Remove `ValidPathsOfType` - use `ValidPaths` with 4th type parameter (`TFilterType`) instead
- **BREAKING**: Remove `ValidFieldPathsOfType` - use `ValidFieldPaths` with 5th type parameter (`TFilterType`) instead
- Add `FieldSelector` type for building type-safe form field components
- Add `FormFieldSelector` type for React Hook Form integration
- Add `mergeFormFieldSelectorProps` utility for form field component factories
- Add `flattenFieldSelector` utility for React dependency array optimization
- Add `Paths<T, FilterType?, Strict?>` with optional type filtering
- Improve `ArrayPaths` and `DiscriminatedInput` typings for discriminated unions

Migration:

- `ValidPathsOfType<Schema, string>` → `ValidPaths<Schema, never, never, string>`
- `ValidFieldPathsOfType<Schema, number>` → `ValidFieldPaths<Schema, never, never, never, number>`
