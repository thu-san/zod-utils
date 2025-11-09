/**
 * Helper type that adds `null` to object-type fields only (excludes arrays).
 * @internal
 */
type AddNullToObjects<T> = {
  [K in keyof T]: T[K] extends readonly unknown[]
    ? T[K]  // Arrays: no null
    : T[K] extends object
    ? T[K] | null  // Objects: add null
    : T[K];  // Primitives: no null
};

/**
 * Transforms Zod schema types for form inputs.
 *
 * - **Primitives** (string, number, boolean): optional → `type | undefined`
 * - **Arrays**: optional → `type[] | undefined`
 * - **Objects**: optional and nullable → `type | null | undefined`
 *
 * @example
 * ```typescript
 * type User = { name: string; tags: string[]; profile: { bio: string } };
 * type FormInput = PartialWithNullableObjects<User>;
 * // { name?: string; tags?: string[]; profile?: { bio: string } | null; }
 * ```
 */
export type PartialWithNullableObjects<T> = Partial<AddNullToObjects<T>>;

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
