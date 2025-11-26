import type z from 'zod';
import type { util } from 'zod';

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
