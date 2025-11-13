import * as z from 'zod';
import { canUnwrap, unwrapUnion } from './schema';
import type { Simplify } from './types';

/**
 * Extracts the default value from a Zod field, recursively unwrapping optional, nullable, and union layers.
 *
 * This function traverses through wrapper types (like `ZodOptional`, `ZodNullable`, `ZodUnion`) to find
 * the underlying `ZodDefault` and returns its default value. If no default is found, returns `undefined`.
 *
 * **Union handling:** For union types, extracts the default from the first option. If the first option
 * has no default, returns `undefined` (defaults in other union options are not checked).
 *
 * @template T - The Zod type to extract default from
 * @param field - The Zod field to extract default from
 * @returns The default value if present, undefined otherwise
 *
 * @example
 * Basic usage with default value
 * ```typescript
 * const field = z.string().default('hello');
 * const defaultValue = extractDefault(field);
 * // Result: 'hello'
 * ```
 *
 * @example
 * Unwrapping optional/nullable layers
 * ```typescript
 * const field = z.string().default('world').optional();
 * const defaultValue = extractDefault(field);
 * // Result: 'world' (unwraps optional to find default)
 * ```
 *
 * @example
 * Union with default in first option
 * ```typescript
 * const field = z.union([z.string().default('hello'), z.number()]);
 * const defaultValue = extractDefault(field);
 * // Result: 'hello' (extracts from first union option)
 * ```
 *
 * @example
 * Union with default in second option
 * ```typescript
 * const field = z.union([z.string(), z.number().default(42)]);
 * const defaultValue = extractDefault(field);
 * // Result: undefined (only checks first option)
 * ```
 *
 * @example
 * Field without default
 * ```typescript
 * const field = z.string().optional();
 * const defaultValue = extractDefault(field);
 * // Result: undefined
 * ```
 *
 * @see {@link getSchemaDefaults} for extracting defaults from entire schemas
 * @since 0.1.0
 */
export function extractDefault<T extends z.ZodTypeAny>(
  field: T,
): z.infer<T> | undefined {
  if (field instanceof z.ZodDefault) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return field.def.defaultValue as z.infer<T>;
  }

  if (canUnwrap(field)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return extractDefault(field.unwrap()) as z.infer<T>;
  }

  if (field instanceof z.ZodUnion) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return extractDefault(unwrapUnion(field).field) as z.infer<T>;
  }

  return undefined;
}

/**
 * Extracts default values from a Zod object schema, returning only fields with explicit `.default()`.
 *
 * This function traverses the schema and collects fields that have explicit default values.
 * Fields without defaults are excluded from the result.
 *
 * **Important:** Nested defaults are NOT extracted unless the parent object also has
 * an explicit `.default()`. This is by design to match Zod's default value behavior.
 *
 * **Component handling:** For form inputs without explicit defaults (like `z.string()` or `z.number()`),
 * use the `?? ''` pattern in your components: `<Input value={field.value ?? ''} />`
 *
 * @template T - The Zod object schema type
 * @param schema - The Zod object schema to extract defaults from
 * @returns A partial object containing only fields with explicit default values
 *
 * @example
 * Basic usage - only explicit defaults
 * ```typescript
 * const schema = z.object({
 *   name: z.string(), // no default → NOT included
 *   age: z.number(), // no default → NOT included
 *   role: z.string().default('user'), // explicit default → included
 *   count: z.number().default(0), // explicit default → included
 * });
 *
 * const defaults = getSchemaDefaults(schema);
 * // Result: { role: 'user', count: 0 }
 * ```
 *
 * @example
 * Nested objects with defaults
 * ```typescript
 * const schema = z.object({
 *   user: z.object({
 *     name: z.string().default('Guest')
 *   }).default({ name: 'Guest' }), // ✅ Extracted because parent has .default()
 *
 *   settings: z.object({
 *     theme: z.string().default('light')
 *   }), // ❌ NOT extracted - parent has no .default()
 * });
 *
 * const defaults = getSchemaDefaults(schema);
 * // Result: { user: { name: 'Guest' } }
 * ```
 *
 * @example
 * Unwrapping optional/nullable fields
 * ```typescript
 * const schema = z.object({
 *   title: z.string().default('Untitled').optional(),
 *   count: z.number().default(0).nullable(),
 *   name: z.string().optional(), // no default → NOT included
 *   age: z.number().optional(), // no default → NOT included
 * });
 *
 * const defaults = getSchemaDefaults(schema);
 * // Result: { title: 'Untitled', count: 0 }
 * ```
 *
 * @example
 * Component usage for fields without defaults
 * ```typescript
 * // For string/number fields without defaults, handle in components:
 * <Input value={field.value ?? ''} />
 * <Input type="number" value={field.value ?? ''} />
 * ```
 *
 * @see {@link extractDefault} for extracting defaults from individual fields
 * @since 0.1.0
 */
export function getSchemaDefaults<T extends z.ZodObject>(
  schema: T,
): Simplify<Partial<z.infer<T>>> {
  const defaults: Record<string, unknown> = {};

  for (const key in schema.shape) {
    const field = schema.shape[key];
    if (!field) continue;

    const defaultValue = extractDefault(field);
    if (defaultValue !== undefined) {
      defaults[key] = defaultValue;
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return defaults as Partial<z.infer<T>>;
}
