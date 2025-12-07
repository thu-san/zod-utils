import type { util, z } from 'zod';
/**
 * Simplifies complex TypeScript types for better IDE hover tooltips and error messages.
 *
 * This utility type flattens intersections and complex type expressions into a single,
 * readable object type. This is especially useful when working with mapped types,
 * conditional types, or type intersections that produce hard-to-read IDE hints.
 *
 * @template T - The type to simplify
 *
 * @example
 * Simplifying intersection types
 * ```typescript
 * type A = { name: string };
 * type B = { age: number };
 * type C = A & B; // Shows as "A & B" in IDE
 * type D = Simplify<A & B>; // Shows as "{ name: string; age: number }" in IDE
 * ```
 *
 * @example
 * Simplifying Partial<> results
 * ```typescript
 * type User = { name: string; age: number; email: string };
 * type PartialUser = Partial<User>; // Shows as "Partial<User>" in IDE
 * type SimplifiedPartialUser = Simplify<Partial<User>>;
 * // Shows as "{ name?: string; age?: number; email?: string }" in IDE
 * ```
 *
 * @example
 * Usage with zod schema inference
 * ```typescript
 * const schema = z.object({ id: z.string() })
 *   .merge(z.object({ name: z.string() }));
 *
 * type InferredType = z.input<typeof schema>; // May show complex type
 * type SimplifiedType = Simplify<z.input<typeof schema>>;
 * // Shows clear: { id: string; name: string }
 * ```
 *
 * @since 0.1.0
 */
export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

// ============================================================================
// Discriminated Union Type Utilities
// ============================================================================

/**
 * Extracts all field keys from a Zod schema's input type.
 *
 * @example
 * ```typescript
 * const schema = z.object({ name: z.string(), age: z.number() });
 * type Keys = DiscriminatorKey<typeof schema>;
 * // "name" | "age"
 * ```
 */
export type DiscriminatorKey<TSchema extends z.ZodType> =
  keyof z.input<TSchema> & string;

/**
 * Extracts the value type for a discriminator field.
 *
 * @example
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 * type Mode = DiscriminatorValue<typeof schema, 'mode'>;
 * // "create" | "edit"
 * ```
 */
export type DiscriminatorValue<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
> = TDiscriminatorKey extends string
  ? z.input<TSchema>[TDiscriminatorKey] & util.Literal
  : never;

/**
 * Discriminator configuration for discriminated union schemas.
 */
export type Discriminator<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
> = {
  key: TDiscriminatorKey;
  value: TDiscriminatorValue;
};

// ============================================================================
// Path Type Utilities
// ============================================================================

type Primitive = string | number | boolean | null | undefined | symbol | bigint;
type NonZeroDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Matches 1-9, 10, 11, 12... (any number starting with non-zero)
type NonZeroIndex = `${NonZeroDigit}` | `${NonZeroDigit}${number}`;

/**
 * Generates paths filtered by value type with .0 hint for arrays.
 * Used for IDE autocomplete hints.
 */
type PathsOfTypeHint<
  T,
  TValueConstraint,
  Prefix extends string = '',
> = T extends Primitive
  ? never
  : T extends (infer E)[]
    ?
        | (NonNullable<T> extends TValueConstraint
            ? Prefix extends ''
              ? never
              : Prefix
            : never)
        | (NonNullable<E> extends TValueConstraint ? `${Prefix}.0` : never)
        | PathsOfTypeHint<NonNullable<E>, TValueConstraint, `${Prefix}.0`>
    : T extends object
      ? {
          [K in keyof T & string]:
            | (NonNullable<T[K]> extends TValueConstraint
                ? Prefix extends ''
                  ? K
                  : `${Prefix}.${K}`
                : never)
            | PathsOfTypeHint<
                NonNullable<T[K]>,
                TValueConstraint,
                Prefix extends '' ? K : `${Prefix}.${K}`
              >;
        }[keyof T & string]
      : never;

/**
 * Generates paths filtered by value type with non-zero indices for arrays.
 * Used for runtime path validation.
 */
type PathsOfTypeLoose<
  T,
  TValueConstraint,
  Prefix extends string = '',
> = T extends Primitive
  ? never
  : T extends (infer E)[]
    ?
        | (NonNullable<T> extends TValueConstraint
            ? Prefix extends ''
              ? never
              : Prefix
            : never)
        | (NonNullable<E> extends TValueConstraint
            ? `${Prefix}.${NonZeroIndex}`
            : never)
        | PathsOfTypeLoose<
            NonNullable<E>,
            TValueConstraint,
            `${Prefix}.${NonZeroIndex}`
          >
    : T extends object
      ? {
          [K in keyof T & string]:
            | (NonNullable<T[K]> extends TValueConstraint
                ? Prefix extends ''
                  ? K
                  : `${Prefix}.${K}`
                : never)
            | PathsOfTypeLoose<
                NonNullable<T[K]>,
                TValueConstraint,
                Prefix extends '' ? K : `${Prefix}.${K}`
              >;
        }[keyof T & string]
      : never;

type PathsHint<T, Prefix extends string = ''> = T extends Primitive
  ? never
  : T extends (infer E)[]
    ?
        | (Prefix extends '' ? never : Prefix)
        | `${Prefix}.0`
        | PathsHint<E, `${Prefix}.0`>
    : T extends object
      ? {
          [K in keyof T & string]:
            | (Prefix extends '' ? K : `${Prefix}.${K}`)
            | PathsHint<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
        }[keyof T & string]
      : never;

type PathsLoose<T, Prefix extends string = ''> = T extends Primitive
  ? never
  : T extends (infer E)[]
    ?
        | (Prefix extends '' ? never : Prefix)
        | `${Prefix}.${NonZeroIndex}`
        | PathsLoose<E, `${Prefix}.${NonZeroIndex}`>
    : T extends object
      ? {
          [K in keyof T & string]:
            | (Prefix extends '' ? K : `${Prefix}.${K}`)
            | PathsLoose<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
        }[keyof T & string]
      : never;

/**
 * Generates all valid dot-notation paths for a given type.
 * Supports nested objects and arrays with numeric indices.
 *
 * @example
 * ```typescript
 * type User = { name: string; address: { city: string } };
 * type UserPaths = Paths<User>;
 * // "name" | "address" | "address.city"
 * ```
 */
export type Paths<T> = PathsHint<T> | PathsLoose<T>;

/**
 * Extracts fields common to all variants in a union type.
 *
 * Uses `Pick<T, keyof T>` to normalize union types by extracting only
 * the keys that exist across all union members.
 *
 * @example
 * ```typescript
 * type A = { mode: 'create'; name: string };
 * type B = { mode: 'edit'; id: number };
 * type Common = CommonFields<A | B>;
 * // { mode: 'create' | 'edit' }
 * ```
 */
export type CommonFields<T> = Pick<T, keyof T>;

/**
 * Extracts the input type from a discriminated union variant.
 *
 * For discriminated unions, narrows to the variant matching the discriminator value
 * and returns its input type. For regular schemas, returns the full input type.
 *
 * @template TSchema - The Zod schema type
 * @template TDiscriminatorKey - The discriminator key
 * @template TDiscriminatorValue - The discriminator value to match
 *
 * @example
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 *
 * type CreateInput = DiscriminatedInput<typeof schema, 'mode', 'create'>;
 * // { mode: 'create'; name: string }
 *
 * type EditInput = DiscriminatedInput<typeof schema, 'mode', 'edit'>;
 * // { mode: 'edit'; id: number }
 * ```
 *
 * @since 0.5.0
 */
export type DiscriminatedInput<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
> = CommonFields<
  Extract<
    Required<z.input<TSchema>>,
    TDiscriminatorKey extends never
      ? z.input<TSchema>
      : TDiscriminatorValue extends never
        ? z.input<TSchema>
        : Simplify<Record<TDiscriminatorKey, TDiscriminatorValue>>
  >
>;

/**
 * Generates valid dot-notation paths for fields in a discriminated union variant.
 *
 * Given a schema and discriminator value, extracts all possible field paths
 * (including nested paths) for that specific variant.
 *
 * @example
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 *
 * type CreatePaths = ValidPaths<typeof schema, 'mode', 'create'>;
 * // "mode" | "name"
 *
 * type EditPaths = ValidPaths<typeof schema, 'mode', 'edit'>;
 * // "mode" | "id"
 * ```
 */
export type ValidPaths<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
> = Paths<DiscriminatedInput<TSchema, TDiscriminatorKey, TDiscriminatorValue>>;

/**
 * Extracts field paths from a schema where the field value type matches a constraint.
 *
 * Filters schema paths (including nested paths) to only those whose input type
 * (with nullish stripped via `NonNullable`) extends the given `TValueConstraint`.
 * For discriminated unions, first narrows to the specific variant before filtering.
 *
 * @template TSchema - The Zod schema type
 * @template TValueConstraint - The value type to filter by
 * @template TDiscriminatorKey - The discriminator key (for discriminated unions)
 * @template TDiscriminatorValue - The discriminator value (for discriminated unions)
 *
 * @example
 * Get all string field paths (including nested)
 * ```typescript
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.string().optional(),
 *   profile: z.object({
 *     bio: z.string(),
 *     avatar: z.string(),
 *   }),
 * });
 *
 * type StringPaths = ValidPathsOfType<typeof schema, string>;
 * // "name" | "email" | "profile.bio" | "profile.avatar"
 * ```
 *
 * @example
 * With discriminated union - filter by type within a variant
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string(), age: z.number() }),
 *   z.object({ mode: z.literal('edit'), id: z.number(), name: z.string() }),
 * ]);
 *
 * type EditNumberPaths = ValidPathsOfType<typeof schema, number, 'mode', 'edit'>;
 * // "id" - only number fields in 'edit' variant
 * ```
 *
 * @see {@link ValidPaths} for discriminated union path filtering
 * @since 0.5.0
 */
export type ValidPathsOfType<
  TSchema extends z.ZodType,
  TValueConstraint,
  TDiscriminatorKey extends
    DiscriminatorKey<TSchema> = DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = DiscriminatorValue<TSchema, TDiscriminatorKey>,
  TVariant = DiscriminatedInput<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >,
> = NonNullable<
  | PathsOfTypeHint<TVariant, TValueConstraint>
  | PathsOfTypeLoose<TVariant, TValueConstraint>
>;
