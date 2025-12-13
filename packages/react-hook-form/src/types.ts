import type {
  Discriminator,
  DiscriminatorKey,
  DiscriminatorValue,
  Simplify,
  ValidPaths,
} from '@zod-utils/core';
import type { FieldValues, Path } from 'react-hook-form';
import type { z } from 'zod';

/**
 * Helper type that adds `null` to object-type fields only (excludes arrays).
 * @internal
 */
type AddNullToObjects<T> = {
  [K in keyof T]: T[K] extends readonly unknown[]
    ? T[K] // Arrays: no null
    : T[K] extends object
      ? T[K] | null // Objects: add null
      : T[K]; // Primitives: no null
};

/**
 * Transforms Zod schema types for form inputs.
 *
 * - **Primitives** (string, number, boolean): optional → `type | undefined`
 * - **Arrays**: optional → `type[] | undefined`
 * - **Objects**: optional and nullable → `type | null | undefined`
 *
 * Uses {@link Simplify} to ensure TypeScript evaluates the type eagerly, which improves
 * type inference and enables forms to work correctly without `defaultValues`.
 *
 * @example
 * ```typescript
 * type User = { name: string; tags: string[]; profile: { bio: string } };
 * type FormInput = PartialWithNullableObjects<User>;
 * // Evaluates to: { name?: string; tags?: string[]; profile?: { bio: string } | null; }
 * ```
 *
 * @example
 * Type inference with useZodForm
 * ```typescript
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const form = useZodForm({ schema }); // ✅ Works without defaultValues
 * ```
 */
export type PartialWithNullableObjects<T> = Simplify<
  Partial<AddNullToObjects<T>>
>;

/**
 * Makes all fields optional and nullable.
 *
 * - **All fields**: optional and nullable → `type | null | undefined`
 *
 * @example
 * ```typescript
 * type User = { name: string; age: number; tags: string[] };
 * type FormInput = PartialWithAllNullables<User>;
 * // { name?: string | null; age?: number | null; tags?: string[] | null; }
 * ```
 */
export type PartialWithAllNullables<T> = {
  [K in keyof T]?: T[K] | null;
};

/**
 * Infers field values from a Zod schema compatible with React Hook Form's FieldValues.
 *
 * @example
 * ```typescript
 * const schema = z.object({ name: z.string() });
 * type Values = InferredFieldValues<typeof schema>;
 * // { name: string } & FieldValues
 * ```
 */
export type InferredFieldValues<TSchema extends z.ZodType> = z.input<TSchema> &
  FieldValues;

/**
 * Type-safe field paths for React Hook Form with optional filtering and discriminated union support.
 *
 * Combines `ValidPaths` from `@zod-utils/core` with React Hook Form's `Path` type
 * for full compatibility with form field APIs.
 *
 * @template TSchema - The Zod schema type
 * @template TDiscriminatorKey - The discriminator key (for discriminated unions)
 * @template TDiscriminatorValue - The discriminator value (for discriminated unions)
 * @template TFilterType - The value type to filter by (default: unknown = no filtering)
 * @template TStrict - Whether to use strict type matching (default: true)
 * @template TFieldValues - The form field values type (inferred from schema)
 *
 * @example
 * Basic usage - all field paths
 * ```typescript
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * });
 *
 * type AllFields = ValidFieldPaths<typeof schema>;
 * // "name" | "age"
 * ```
 *
 * @example
 * Filter by type - string fields only
 * ```typescript
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.string().optional(),
 * });
 *
 * type StringFields = ValidFieldPaths<typeof schema, never, never, string>;
 * // "name" | "email"
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
 * type CreateFields = ValidFieldPaths<typeof schema, 'mode', 'create'>;
 * // "mode" | "name"
 *
 * type EditNumberFields = ValidFieldPaths<typeof schema, 'mode', 'edit', number>;
 * // "id"
 * ```
 *
 * @see {@link ValidPaths} for the base type without react-hook-form Path intersection
 */
export type ValidFieldPaths<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFieldValues extends
    InferredFieldValues<TSchema> = InferredFieldValues<TSchema>,
  TFilterType = unknown,
  TStrict extends boolean = true,
> = ValidPaths<
  TSchema,
  TDiscriminatorKey,
  TDiscriminatorValue,
  TFilterType,
  TStrict
> &
  Path<TFieldValues>;

/**
 * Type-safe field selector for React Hook Form with discriminated union support.
 *
 * Returns an object type containing:
 * - `schema` - The Zod schema
 * - `name` - The field path (type-safe)
 * - `discriminator` - Required for discriminated unions, contains `key` and `value`
 *
 * @template TSchema - The Zod schema type
 * @template TPath - The field path
 * @template TDiscriminatorKey - The discriminator key (for discriminated unions)
 * @template TDiscriminatorValue - The discriminator value (for discriminated unions)
 * @template TFilterType - The value type to filter by (default: unknown = no filtering)
 * @template TStrict - Whether to use strict type matching (default: true)
 *
 * @example
 * Basic usage with regular schema
 * ```typescript
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * });
 *
 * type NameSelector = FieldValueSelector<typeof schema, 'name'>;
 * // { schema: typeof schema; name: 'name' }
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
 * type CreateNameSelector = FieldValueSelector<typeof schema, 'name', 'mode', 'create'>;
 * // { schema: typeof schema; name: 'name'; discriminator: { key: 'mode'; value: 'create' } }
 * ```
 *
 * @see {@link FieldSelector} from `@zod-utils/core` for the base type
 */
export type FieldValueSelector<
  TSchema extends z.ZodType,
  TPath extends ValidFieldPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFieldValues extends
    InferredFieldValues<TSchema> = InferredFieldValues<TSchema>,
  TFilterType = unknown,
  TStrict extends boolean = true,
> = TSchema extends z.ZodDiscriminatedUnion
  ? {
      schema: TSchema;
      name: TPath;
      discriminator: Discriminator<
        TSchema,
        TDiscriminatorKey,
        TDiscriminatorValue
      >;
    }
  : {
      schema: TSchema;
      name: TPath;
    };
