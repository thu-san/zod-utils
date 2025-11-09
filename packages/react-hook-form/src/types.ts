/**
 * Transforms all properties in a type to be optional and nullable.
 *
 * This type utility is the secret sauce behind `useZodForm`'s type transformation.
 * It makes form inputs accept `null | undefined` during editing, while validated
 * output remains exactly as the schema defines.
 *
 * **Why this matters:**
 * - React Hook Form fields often contain `null` or `undefined` during user input
 * - Zod schemas define strict output types without these nullable/optional wrappers
 * - This type bridges the gap, eliminating "Type 'null' is not assignable to..." errors
 *
 * @template T - The object type to transform
 *
 * @example
 * Basic transformation
 * ```typescript
 * type User = {
 *   name: string;
 *   age: number;
 * };
 *
 * type FormUser = MakeOptionalAndNullable<User>;
 * // Result: {
 * //   name?: string | null;
 * //   age?: number | null;
 * // }
 * ```
 *
 * @example
 * Usage with useZodForm
 * ```typescript
 * const schema = z.object({
 *   title: z.string(),
 *   count: z.number(),
 * });
 *
 * const form = useZodForm({ schema });
 *
 * // ✅ These work without type errors:
 * form.setValue('title', null); // Accepts null during editing
 * form.setValue('title', undefined); // Accepts undefined
 * form.reset({ title: null, count: null }); // Reset with null values
 *
 * // But validated output is still:
 * // { title: string, count: number }
 * ```
 *
 * @example
 * Comparison with original type
 * ```typescript
 * type Schema = {
 *   email: string;
 *   isActive: boolean;
 * };
 *
 * // Original: { email: string; isActive: boolean }
 * // Transformed: { email?: string | null; isActive?: boolean | null }
 *
 * const original: Schema = { email: '', isActive: true }; // OK
 * const original2: Schema = { email: null }; // ❌ Error
 *
 * const transformed: MakeOptionalAndNullable<Schema> = {}; // OK
 * const transformed2: MakeOptionalAndNullable<Schema> = { email: null }; // OK
 * ```
 *
 * @see {@link useZodForm} for how this type is used in practice
 * @since 0.1.0
 */
export type MakeOptionalAndNullable<T> = {
  [K in keyof T]?: T[K] | null;
};
