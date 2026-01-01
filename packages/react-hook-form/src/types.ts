import type { Simplify } from '@zod-utils/core';

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
