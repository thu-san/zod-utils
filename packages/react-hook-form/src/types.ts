import type { Simplify } from '@zod-utils/core';
import type { z } from 'zod';

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
 * Brand symbol for marking objects that should receive recursive partial transformation.
 * @internal
 */
declare const FormInputBrand: unique symbol;

/**
 * Branded type to mark objects that should have their direct fields made partial.
 * Use with {@link partialFields} helper to mark specific schema objects.
 *
 * @example
 * ```typescript
 * // Objects marked with PartialFields will have their direct fields made optional
 * type MarkedObject = PartialFields<{ name: string; age: number }>;
 * ```
 */
export type PartialFields<T> = T & {
  readonly [FormInputBrand]?: typeof FormInputBrand;
};

/**
 * Helper type to safely get the brand property from a type.
 * Returns `unknown` for non-branded types, `typeof FormInputBrand | undefined` for branded types.
 * @internal
 */
type GetPartialFieldsBrand<T> = (T & {
  [FormInputBrand]?: unknown;
})[typeof FormInputBrand];

/**
 * Helper type to check if a type has the PartialFields brand.
 * Uses bidirectional extends check to distinguish branded from non-branded types.
 * @internal
 */
type IsPartialFieldsBranded<T> = GetPartialFieldsBrand<T> extends
  | typeof FormInputBrand
  | undefined
  ? typeof FormInputBrand extends GetPartialFieldsBrand<T>
    ? true
    : false
  : false;

/**
 * Helper type to extract the inner type from a PartialFields branded type.
 * @internal
 */
type ExtractPartialFieldsInner<T> = T extends PartialFields<infer U>
  ? U
  : never;

/**
 * Helper function to mark a Zod schema so its direct fields become partial.
 *
 * By default, nested objects in form inputs keep their fields strict (only the object
 * itself becomes nullable). Use this helper to opt-in specific objects to have their
 * direct fields also become optional.
 *
 * **Note:** This only affects the direct fields of the marked object. Nested objects
 * within it will still stay strict unless they are also wrapped with `partialFields()`.
 *
 * **Use cases:**
 * - Form input fields that users fill in manually (should be partial)
 * - Objects from selectors/dropdowns should NOT use this (keep strict)
 *
 * @example
 * ```typescript
 * import { partialFields } from '@zod-utils/react-hook-form';
 *
 * const schema = z.object({
 *   price: z.number(),
 *   // User fills in these fields - opt-in to partial
 *   detail: partialFields(z.object({
 *     hotel: z.string(),
 *     nights: z.number(),
 *   })),
 *   // Selected from dropdown - stays strict
 *   agent: z.object({
 *     name: z.string(),
 *     fee: z.number(),
 *   }),
 * });
 *
 * // Result with PartialWithNullableObjects:
 * // detail.hotel  → string | undefined (partial - user input)
 * // detail.nights → number | undefined (partial - user input)
 * // agent.name    → string (strict! - from selector)
 * // agent.fee     → number (strict! - from selector)
 * ```
 */
export function partialFields<T extends z.ZodType>(
  schema: T,
): z.ZodType<PartialFields<z.infer<T>>, PartialFields<z.input<T>>> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return schema as z.ZodType<
    PartialFields<z.infer<T>>,
    PartialFields<z.input<T>>
  >;
}

/**
 * Transforms object types for form inputs with selective recursion.
 *
 * **Default behavior (non-recursive):**
 * - **Primitives** (string, number, boolean): optional → `type | undefined`
 * - **Arrays**: optional → `type[] | undefined`
 * - **Built-in objects** (Date, RegExp, etc.): optional and nullable → `type | null | undefined`
 * - **Plain objects**: optional and nullable, but nested fields stay **strict** → `{ strictField: type } | null | undefined`
 *
 * **Opt-in recursive behavior:**
 * - Objects marked with {@link partialFields} will have their nested fields recursively transformed
 *
 * This ensures objects from selectors/dropdowns keep strict types for their fields,
 * while form input fields can be partially filled.
 *
 * @example
 * ```typescript
 * import { partialFields } from '@zod-utils/react-hook-form';
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   price: z.number(),
 *   detail: partialFields(z.object({ hotel: z.string(), nights: z.number() })),
 *   agent: z.object({ name: z.string(), fee: z.number() }),
 * });
 *
 * type FormInput = PartialWithNullableObjects<z.infer<typeof schema>>;
 * // {
 * //   price?: number;
 * //   detail?: { hotel?: string; nights?: number } | null;  // Recursive!
 * //   agent?: { name: string; fee: number } | null;          // Strict nested!
 * // }
 * ```
 */
export type PartialWithNullableObjects<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K] // Arrays: just optional (via ?), no null, no recursion
    : T[K] extends BuiltInObject
      ? T[K] | null // Built-in objects: optional + nullable, no recursion
      : IsPartialFieldsBranded<T[K]> extends true
        ? Simplify<
            PartialWithNullableObjects<ExtractPartialFieldsInner<T[K]>>
          > | null // FormInput marked: recurse + null + optional
        : T[K] extends object
          ? T[K] | null // Plain objects: optional + nullable, NO recursion (strict nested)
          : T[K]; // Primitives: just optional (via ?)
};

/**
 * Transforms all fields to be optional and nullable, with selective recursion.
 *
 * Similar to {@link PartialWithNullableObjects} but also adds `| null` to primitives and arrays.
 *
 * **Default behavior (non-recursive):**
 * - **Primitives**: optional and nullable → `type | null | undefined`
 * - **Arrays**: optional and nullable → `type[] | null | undefined`
 * - **Plain objects**: optional and nullable, but nested fields stay **strict**
 *
 * **Opt-in recursive behavior:**
 * - Objects marked with {@link partialFields} will have their nested fields recursively transformed
 *
 * @example
 * ```typescript
 * type User = { name: string; age: number; profile: { bio: string } };
 * type FormInput = PartialWithAllNullables<User>;
 * // { name?: string | null; age?: number | null; profile?: { bio: string } | null; }
 * // Note: profile.bio stays strict (string, not string | null | undefined)
 * ```
 */
export type PartialWithAllNullables<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K] | null // Arrays: optional + nullable, no recursion
    : T[K] extends BuiltInObject
      ? T[K] | null // Built-in objects: optional + nullable, no recursion
      : IsPartialFieldsBranded<T[K]> extends true
        ? Simplify<
            PartialWithAllNullables<ExtractPartialFieldsInner<T[K]>>
          > | null // FormInput marked: recurse + null + optional
        : T[K] extends object
          ? T[K] | null // Plain objects: optional + nullable, NO recursion (strict nested)
          : T[K] | null; // Primitives: optional + nullable
};
