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

// Matches 1-9, 10, 11, 12... (any number starting with non-zero)
type NonZeroIndex = `${NonZeroDigit}` | `${NonZeroDigit}${number}`;

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
> = Paths<
  CommonFields<
    Extract<
      Required<z.input<TSchema>>,
      TDiscriminatorKey extends never
        ? z.input<TSchema>
        : TDiscriminatorValue extends never
          ? z.input<TSchema>
          : Simplify<Record<TDiscriminatorKey, TDiscriminatorValue>>
    >
  >
>;
