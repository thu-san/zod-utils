import type {
  DiscriminatorKey,
  DiscriminatorValue,
  Simplify,
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
 * Type-safe field names for a specific discriminator value.
 *
 * Narrows field names to only those that exist for the given discriminator value
 * in a discriminated union schema.
 *
 * @example
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 *
 * type CreateFields = ValidFieldName<typeof schema, 'mode', 'create'>;
 * // "mode" | "name"
 *
 * type EditFields = ValidFieldName<typeof schema, 'mode', 'edit'>;
 * // "mode" | "id"
 * ```
 */
export type ValidFieldName<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
  TFieldValues extends
    InferredFieldValues<TSchema> = InferredFieldValues<TSchema>,
> = keyof Extract<
  Required<z.input<TSchema>>,
  Record<TDiscriminatorKey, TDiscriminatorValue>
> &
  Path<TFieldValues>;
