import type { util, z } from 'zod';
import type { SomeType } from 'zod/v4/core';
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
 * Recursively unwraps Zod wrapper types to get the core schema type.
 * Handles: ZodPipe (transform), ZodOptional, ZodNullable, ZodDefault
 */
export type UnwrapZodType<T> = T extends z.ZodPipe<infer In, SomeType>
  ? UnwrapZodType<In>
  : T extends z.ZodOptional<infer Inner>
    ? UnwrapZodType<Inner>
    : T extends z.ZodNullable<infer Inner>
      ? UnwrapZodType<Inner>
      : T extends z.ZodDefault<infer Inner>
        ? UnwrapZodType<Inner>
        : T;

/**
 * Checks if the core (unwrapped) type is a ZodDiscriminatedUnion.
 */
export type IsDiscriminatedUnion<T> =
  UnwrapZodType<T> extends z.ZodDiscriminatedUnion ? true : false;

/**
 * Conditional discriminator prop type for schemas.
 *
 * For discriminated unions: returns `{ discriminator: { key, value } }` (required)
 * For non-unions: returns `{ discriminator?: never }` (prohibited)
 *
 * This enables type-safe props where discriminator is only required when the schema
 * is actually a discriminated union.
 *
 * @example
 * ```typescript
 * // Use as props intersection:
 * type Props<TSchema> = { schema: TSchema; name: string } & DiscriminatorField<TSchema, TKey, TValue>;
 *
 * // For discriminated unions - discriminator is required
 * // For regular objects - discriminator is prohibited
 *
 * // To extract the { key, value } object:
 * DiscriminatorField<Schema, Key, Value>['discriminator']
 * ```
 */
export type DiscriminatorField<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
> = IsDiscriminatedUnion<TSchema> extends true
  ? { discriminator: { key: TDiscriminatorKey; value: TDiscriminatorValue } }
  : { discriminator?: never };

// ============================================================================
// Path Type Utilities
// ============================================================================

// ============================================================================================
// ↓↓↓↓↓↓↓↓↓↓↓↓ Forked from react-hook-form types

export interface FileList {
  readonly length: number;
  item(index: number): File | null;
  [index: number]: File;
}

type Primitive = string | number | boolean | bigint | symbol | undefined | null;
type BrowserNativeObject = Date | FileList | File;
type ArrayKey = number;

type IsTuple<T extends ReadonlyArray<unknown>> = number extends T['length']
  ? false
  : true;

type TupleKeys<T extends ReadonlyArray<unknown>> = Exclude<
  keyof T,
  keyof unknown[]
>;

type IsEqual<T1, T2> = T1 extends T2
  ? (<G>() => G extends T1 ? 1 : 2) extends <G>() => G extends T2 ? 1 : 2
    ? true
    : false
  : false;

type AnyIsEqual<T1, T2> = T1 extends T2
  ? IsEqual<T1, T2> extends true
    ? true
    : never
  : never;

type HasMatch<V, TFilterType> = V extends TFilterType ? true : false;

type IsNullable<V> = null extends V ? true : undefined extends V ? true : false;

type CheckFilter<V, TFilterType, TStrict extends boolean> = TStrict extends true
  ? [V] extends [TFilterType]
    ? true
    : false
  : true extends HasMatch<V, TFilterType>
    ? true
    : false;

type ArrayPaths = '${number}' | `${number}`;

export type PathImpl<
  K extends string | number,
  V,
  TraversedTypes,
  TFilterType = unknown,
  TStrict extends boolean = true,
> = [V] extends [Primitive | BrowserNativeObject]
  ? CheckFilter<V, TFilterType, TStrict> extends true
    ? K extends number
      ? ArrayPaths
      : `${K}`
    : never
  : true extends AnyIsEqual<TraversedTypes, V>
    ? CheckFilter<V, TFilterType, TStrict> extends true
      ? `${K}`
      : never
    : K extends number
      ?
          | (CheckFilter<V, TFilterType, TStrict> extends true
              ? ArrayPaths
              : never)
          | `${ArrayPaths}.${PathInternal<V, TraversedTypes | V, TFilterType, TStrict>}`
      :
          | (CheckFilter<V, TFilterType, TStrict> extends true ? `${K}` : never)
          // When no filter type is specified, always allow nested paths to continue.
          | (unknown extends TFilterType
              ? `${K}.${PathInternal<V, TraversedTypes | V, TFilterType, TStrict>}`
              : // When filtering and the parent value is nullable/undefined:
                // - in strict mode, stop path traversal at this key,
                // - in non-strict mode, still allow nested paths to continue.
                IsNullable<V> extends true
                ? TStrict extends true
                  ? never
                  : `${K}.${PathInternal<V, TraversedTypes | V, TFilterType, TStrict>}`
                : // Non-nullable parent with filter type: always allow nested paths to continue.
                  `${K}.${PathInternal<V, TraversedTypes | V, TFilterType, TStrict>}`);

export type PathInternal<
  T,
  TraversedTypes = T,
  TFilterType = unknown,
  TStrict extends boolean = true,
> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: PathImpl<
          K & string,
          T[K],
          TraversedTypes,
          TFilterType,
          TStrict
        >;
      }[TupleKeys<T>]
    : PathImpl<ArrayKey, V, TraversedTypes, TFilterType, TStrict>
  : {
      [K in keyof T]-?: PathImpl<
        K & string,
        T[K],
        TraversedTypes,
        TFilterType,
        TStrict
      >;
    }[keyof T];

// Public API
export type Paths<
  T,
  TFilterType = unknown,
  TStrict extends boolean = true,
> = PathInternal<T, T, TFilterType, TStrict>;

// ↑↑↑↑↑↑↑↑↑↑↑ Forked from react-hook-form types
// ============================================================================================

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
 */
export type DiscriminatedInput<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
> = IsDiscriminatedUnion<TSchema> extends true
  ? Simplify<
      CommonFields<
        Extract<
          z.input<TSchema>,
          [TDiscriminatorKey] extends [never]
            ? z.input<TSchema>
            : [TDiscriminatorValue] extends [never]
              ? z.input<TSchema>
              : Simplify<
                  | Record<TDiscriminatorKey, TDiscriminatorValue>
                  | Partial<Record<TDiscriminatorKey, TDiscriminatorValue>>
                >
        >
      >
    >
  : z.input<TSchema>;

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
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = unknown,
  TStrict extends boolean = true,
> = Paths<
  DiscriminatedInput<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
  TFilterType,
  TStrict
>;

/**
 * Type for props containing a Zod schema.
 *
 * A simple wrapper type useful for factory functions and component props
 * that need to accept a schema parameter.
 *
 * @template TSchema - The Zod schema type
 *
 * @example
 * Factory function accepting schema
 * ```typescript
 * function createFormField<TSchema extends z.ZodType>(
 *   props: SchemaField<TSchema>
 * ) {
 *   return (childProps: NameField<TSchema>) => {
 *     // Use props.schema and childProps.name
 *   };
 * }
 * ```
 *
 * @example
 * Component props with schema
 * ```typescript
 * type MyComponentProps<TSchema extends z.ZodType> =
 *   SchemaField<TSchema> & { label: string };
 * ```
 */
export type SchemaField<TSchema extends z.ZodType> = {
  schema: TSchema;
};

/**
 * Type for props containing a schema and optional discriminator.
 *
 * Combines SchemaField and DiscriminatorField for functions that need
 * schema + discriminator but don't take a field name path.
 *
 * @template TSchema - The Zod schema type
 * @template TDiscriminatorKey - The discriminator key for discriminated unions
 * @template TDiscriminatorValue - The discriminator value for discriminated unions
 *
 * @example
 * Function accepting schema with discriminator
 * ```typescript
 * function getDefaults<
 *   TSchema extends z.ZodType,
 *   TDiscriminatorKey extends DiscriminatorKey<TSchema>,
 *   TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
 * >(
 *   params: SchemaAndDiscriminatorField<TSchema, TDiscriminatorKey, TDiscriminatorValue>
 * ) {
 *   // Use params.schema and params.discriminator
 * }
 * ```
 */
export type SchemaAndDiscriminatorField<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
> = SchemaField<TSchema> &
  DiscriminatorField<TSchema, TDiscriminatorKey, TDiscriminatorValue>;

/**
 * Type for props containing a field name path.
 *
 * Supports discriminated union narrowing via TDiscriminatorKey/TDiscriminatorValue.
 * The name is constrained to valid paths within the schema.
 *
 * @template TSchema - The Zod schema type
 * @template TPath - The path type (must extend ValidPaths)
 * @template TDiscriminatorKey - The discriminator key for discriminated unions
 * @template TDiscriminatorValue - The discriminator value for discriminated unions
 * @template TFilterType - Optional type filter for paths
 * @template TStrict - Whether to use strict path matching
 *
 * @example
 * Basic usage with object schema
 * ```typescript
 * const schema = z.object({ name: z.string(), age: z.number() });
 *
 * type Props = NameField<typeof schema, 'name'>;
 * // { name: 'name' }
 * ```
 *
 * @example
 * With discriminated union
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 *
 * type CreateProps = NameField<typeof schema, 'name', 'mode', 'create'>;
 * // { name: 'name' }
 * ```
 */
export type NameField<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = unknown,
  TStrict extends boolean = true,
> = {
  name: TPath;
};

/**
 * Complete field selector type combining schema, name path, and discriminator.
 *
 * This is the main type for selecting fields from a Zod schema with full
 * discriminated union support. Combines:
 * - `SchemaField<TSchema>` - the schema prop
 * - `NameField<...>` - the name path prop
 * - `DiscriminatorField<...>` - conditional discriminator (required for unions, prohibited otherwise)
 *
 * @template TSchema - The Zod schema type
 * @template TDiscriminatorKey - The discriminator key for discriminated unions
 * @template TDiscriminatorValue - The discriminator value for discriminated unions
 * @template TFilterType - Optional type filter for paths
 * @template TStrict - Whether to use strict path matching
 * @template TPath - The path type (must extend ValidPaths)
 *
 * @example
 * Basic usage with object schema
 * ```typescript
 * const schema = z.object({ name: z.string(), age: z.number() });
 *
 * type Props = SchemaFieldSelector<typeof schema>;
 * // { schema: typeof schema; name: 'name' | 'age'; discriminator?: never }
 * ```
 *
 * @example
 * With discriminated union
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 *
 * type CreateProps = SchemaFieldSelector<typeof schema, 'mode', 'create'>;
 * // { schema: typeof schema; name: 'mode' | 'name'; discriminator: { key: 'mode'; value: 'create' } }
 * ```
 *
 * @example
 * With type filtering
 * ```typescript
 * const schema = z.object({ name: z.string(), age: z.number(), count: z.number() });
 *
 * type NumberFieldProps = SchemaFieldSelector<typeof schema, never, never, number>;
 * // { schema: typeof schema; name: 'age' | 'count'; discriminator?: never }
 * ```
 */
export type SchemaFieldSelector<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = unknown,
  TStrict extends boolean = true,
> = SchemaField<TSchema> &
  NameField<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  > &
  DiscriminatorField<TSchema, TDiscriminatorKey, TDiscriminatorValue>;
