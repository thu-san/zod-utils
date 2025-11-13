import * as z from 'zod';
import { canUnwrap, getPrimitiveType, unwrapUnion } from './schema';
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
 * Options for configuring default value extraction behavior
 */
export interface GetSchemaDefaultsOptions {
  /**
   * Whether to return empty string ("") for string fields without explicit defaults.
   * When enabled, all string fields will default to "" even if they don't have `.default()`.
   *
   * @default true
   */
  emptyStringDefaults?: boolean;
}

/**
 * Extracts default values from a Zod object schema while skipping fields without defaults.
 *
 * This function recursively traverses the schema and collects all fields that have
 * explicit default values defined. Fields without defaults are excluded from the result.
 *
 * **Important:** Nested defaults are NOT extracted unless the parent object also has
 * an explicit `.default()`. This is by design to match Zod's default value behavior.
 *
 * **String defaults:** By default, string fields without explicit `.default()` will
 * return empty string (""). Disable with `{ emptyStringDefaults: false }`.
 *
 * @template T - The Zod object schema type
 * @param schema - The Zod object schema to extract defaults from
 * @param options - Configuration options
 * @param options.emptyStringDefaults - Return "" for strings without defaults (default: true)
 * @returns A partial object containing only fields with default values
 *
 * @example
 * Basic usage with string defaults (default behavior)
 * ```typescript
 * const schema = z.object({
 *   name: z.string(), // no explicit default → returns ""
 *   age: z.number(), // no default - will be skipped
 *   title: z.string().default('Mr.'), // explicit default
 * });
 *
 * const defaults = getSchemaDefaults(schema);
 * // Result: { name: '', title: 'Mr.' }
 * ```
 *
 * @example
 * Disabling empty string defaults
 * ```typescript
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   title: z.string().default('Mr.'),
 * });
 *
 * const defaults = getSchemaDefaults(schema, { emptyStringDefaults: false });
 * // Result: { title: 'Mr.' } (name is skipped)
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
 *   name: z.string().optional(), // optional string → returns ""
 * });
 *
 * const defaults = getSchemaDefaults(schema);
 * // Result: { title: 'Untitled', count: 0, name: '' }
 * ```
 *
 * @see {@link extractDefault} for extracting defaults from individual fields
 * @since 0.1.0
 */
export function getSchemaDefaults<T extends z.ZodObject>(
  schema: T,
  options: GetSchemaDefaultsOptions = {},
): Simplify<Partial<z.infer<T>>> {
  const { emptyStringDefaults = true } = options;
  const defaults: Record<string, unknown> = {};

  for (const key in schema.shape) {
    const field = schema.shape[key];
    if (!field) continue;

    // Check if this field has an explicit default value
    const defaultValue = extractDefault(field);
    if (defaultValue !== undefined) {
      defaults[key] = defaultValue;
    } else if (emptyStringDefaults) {
      // For string fields without explicit defaults, return empty string
      const primitiveType = getPrimitiveType(field);
      if (primitiveType instanceof z.ZodString) {
        defaults[key] = '';
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return defaults as Partial<z.infer<T>>;
}
