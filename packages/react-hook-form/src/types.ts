import type { Simplify } from '@zod-utils/core';

/**
 * Built-in types that should not be recursively transformed.
 * These are treated as leaf values (like primitives) and only get `| null` added.
 * @internal
 */
type BuiltInObject =
  | Date
  | RegExp
  | Map<unknown, unknown>
  | Set<unknown>
  | WeakMap<object, unknown>
  | WeakSet<object>
  | Promise<unknown>
  | Error;

/**
 * Recursively transforms object types for form inputs.
 *
 * - **Primitives** (string, number, boolean): optional → `type | undefined`
 * - **Arrays**: optional → `type[] | undefined`
 * - **Built-in objects** (Date, RegExp, etc.): optional and nullable → `type | null | undefined`
 * - **Plain objects**: optional, nullable, and recursively transformed → `DeepType | null | undefined`
 *
 * This ensures `useWatch` returns correct types at any nesting depth,
 * since form fields are `undefined` until values are set.
 *
 * @example
 * ```typescript
 * type User = { name: string; tags: string[]; profile: { bio: string } };
 * type FormInput = DeepPartialWithNullableObjects<User>;
 * // Evaluates to: { name?: string; tags?: string[]; profile?: { bio?: string } | null; }
 * ```
 *
 * @example
 * Type inference with useZodForm
 * ```typescript
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const form = useZodForm({ schema }); // ✅ Works without defaultValues
 * const name = form.watch('name'); // ✅ Correctly typed as string | undefined
 * ```
 *
 * @example
 * Nested fields are also correctly typed
 * ```typescript
 * const schema = z.object({ profile: z.object({ bio: z.string() }) });
 * const form = useZodForm({ schema });
 * const bio = form.watch('profile.bio'); // ✅ Correctly typed as string | undefined
 * ```
 */
export type DeepPartialWithNullableObjects<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K] // Arrays: just optional (via ?), no null, no recursion
    : T[K] extends BuiltInObject
      ? T[K] | null // Built-in objects: optional + nullable, no recursion
      : T[K] extends object
        ? Simplify<DeepPartialWithNullableObjects<T[K]>> | null // Plain objects: recurse + null + optional (via ?)
        : T[K]; // Primitives: just optional (via ?)
};

/**
 * @deprecated Use {@link DeepPartialWithNullableObjects} instead.
 * This alias is kept for backward compatibility.
 */
export type PartialWithNullableObjects<T> = DeepPartialWithNullableObjects<T>;

/**
 * Recursively makes all fields optional and nullable.
 *
 * - **Primitives**: optional and nullable → `type | null | undefined`
 * - **Arrays**: optional and nullable → `type[] | null | undefined`
 * - **Built-in objects** (Date, RegExp, etc.): optional and nullable → `type | null | undefined`
 * - **Plain objects**: optional, nullable, and recursively transformed → `DeepType | null | undefined`
 *
 * @example
 * ```typescript
 * type User = { name: string; age: number; profile: { bio: string } };
 * type FormInput = DeepPartialWithAllNullables<User>;
 * // { name?: string | null; age?: number | null; profile?: { bio?: string | null } | null; }
 * ```
 */
export type DeepPartialWithAllNullables<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K] | null // Arrays: optional + nullable, no recursion
    : T[K] extends BuiltInObject
      ? T[K] | null // Built-in objects: optional + nullable, no recursion
      : T[K] extends object
        ? Simplify<DeepPartialWithAllNullables<T[K]>> | null // Plain objects: recurse + null + optional
        : T[K] | null; // Primitives: optional + nullable
};

/**
 * @deprecated Use {@link DeepPartialWithAllNullables} instead.
 * This alias is kept for backward compatibility.
 */
export type PartialWithAllNullables<T> = DeepPartialWithAllNullables<T>;
