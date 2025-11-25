import type { util } from 'zod';
import * as z from 'zod';
import {
  canUnwrap,
  extractDiscriminatedSchema,
  getPrimitiveType,
  tryStripNullishOnly,
} from './schema';
import type { Simplify } from './types';

/**
 * Extracts the default value from a Zod field, recursively unwrapping optional, nullable, and union layers.
 *
 * This function traverses through wrapper types (like `ZodOptional`, `ZodNullable`, `ZodUnion`) to find
 * the underlying `ZodDefault` and returns its default value. If no default is found, returns `undefined`.
 *
 * **Union handling:** For union types, strips nullish types (null/undefined) first. If only one type
 * remains after stripping, extracts the default from that type. If multiple non-nullish types remain,
 * returns `undefined` (does not extract from any option).
 *
 * @template T - The Zod type to extract default from
 * @param field - The Zod field to extract default from
 * @returns The default value if present, undefined otherwise
 *
 * @example
 * Basic usage with default value
 * ```typescript
 * const field = z.string().default('hello');
 * const defaultValue = extractDefaultValue(field);
 * // Result: 'hello'
 * ```
 *
 * @example
 * Unwrapping optional/nullable layers
 * ```typescript
 * const field = z.string().default('world').optional();
 * const defaultValue = extractDefaultValue(field);
 * // Result: 'world' (unwraps optional to find default)
 * ```
 *
 * @example
 * Union with only nullish types stripped to single type
 * ```typescript
 * const field = z.union([z.string().default('hello'), z.null()]);
 * const defaultValue = extractDefaultValue(field);
 * // Result: 'hello' (null stripped, leaving only string)
 * ```
 *
 * @example
 * Union with multiple non-nullish types
 * ```typescript
 * const field = z.union([z.string().default('hello'), z.number()]);
 * const defaultValue = extractDefaultValue(field);
 * // Result: undefined (multiple non-nullish types - no default extracted)
 * ```
 *
 * @example
 * Field without default
 * ```typescript
 * const field = z.string().optional();
 * const defaultValue = extractDefaultValue(field);
 * // Result: undefined
 * ```
 *
 * @see {@link getSchemaDefaults} for extracting defaults from entire schemas
 * @see {@link tryStripNullishOnly} for union nullish stripping logic
 * @since 0.1.0
 */
export function extractDefaultValue<T extends z.ZodType>(
  field: T,
): z.input<T> | undefined {
  if (field instanceof z.ZodDefault) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return field.def.defaultValue as z.input<T>;
  }

  if (canUnwrap(field)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return extractDefaultValue(field.unwrap()) as z.input<T>;
  }

  if (field instanceof z.ZodUnion) {
    const unwrapped = tryStripNullishOnly(field);
    if (unwrapped !== false) {
      // Successfully unwrapped to single type
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return extractDefaultValue(unwrapped) as z.input<T>;
    }

    // Multiple non-nullish types or all nullish - no default
    return undefined;
  }

  if (field instanceof z.ZodPipe && field.def.in instanceof z.ZodType) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return extractDefaultValue(field.def.in) as z.input<T>;
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
 * @template TSchema - The Zod object schema type
 * @param targetSchema - The Zod object schema to extract defaults from
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
 * @see {@link extractDefaultValue} for extracting defaults from individual fields
 * @since 0.1.0
 */
export function getSchemaDefaults<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends keyof z.input<TSchema> & string,
  TDiscriminatorValue extends z.input<TSchema>[TDiscriminatorKey] &
    util.Literal,
>(
  schema: TSchema,
  options?: {
    discriminator?: {
      key: TDiscriminatorKey;
      value: TDiscriminatorValue;
    };
  },
): Simplify<Partial<z.input<TSchema>>> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const primitiveSchema = getPrimitiveType(schema) as TSchema;

  let targetSchema: z.ZodObject | undefined;
  if (primitiveSchema instanceof z.ZodDiscriminatedUnion) {
    if (options?.discriminator) {
      targetSchema = extractDiscriminatedSchema({
        schema: primitiveSchema,
        ...options.discriminator,
      });
    }
  } else if (primitiveSchema instanceof z.ZodObject) {
    targetSchema = primitiveSchema;
  }

  const defaults: Record<string, unknown> = {};

  if (targetSchema) {
    for (const key in targetSchema.shape) {
      const field = targetSchema.shape[key];
      if (!field) continue;

      const defaultValue = extractDefaultValue(field);
      if (defaultValue !== undefined) {
        defaults[key] = defaultValue;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return defaults as Partial<z.input<TSchema>>;
}
