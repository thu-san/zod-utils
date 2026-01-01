---
"@zod-utils/react-hook-form": major
"@zod-utils/core": major
---

BREAKING: Refactor type utilities and field selector pattern

- Rename `Discriminator` to `DiscriminatorProps` for clearer conditional prop typing
- Remove `toFieldSelector` helper - use `FieldSelectorProps` type directly instead
- Add new composable prop types: `SchemaProps`, `SchemaAndDiscriminatorProps`, `NameProps`, `NameAndDiscriminatorProps`, `FieldSelectorProps`
- Add `IsDiscriminatedUnion` type utility for conditional discriminator requirements

Migration:

- Replace `Discriminator<Schema, Key, Value>` with `DiscriminatorProps<Schema, Key, Value>`
- Replace `toFieldSelector(props)` with direct usage of `FieldSelectorProps` type in generic constraints
