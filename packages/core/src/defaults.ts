import * as z from 'zod';

/**
 * Extract the default value from a Zod field (recursively unwraps optional/nullable)
 * @param field - The Zod field to extract default from
 * @returns The default value if present, undefined otherwise
 */
export function extractDefault(field: z.ZodTypeAny): any {
  if (field instanceof z.ZodDefault) {
    const defaultValue = field._def.defaultValue;
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  }

  if ('unwrap' in field && typeof field.unwrap === 'function') {
    return extractDefault(field.unwrap());
  }

  return undefined;
}

/**
 * Get the unwrapped type without going through defaults
 * Useful for detecting nested objects/arrays while preserving defaults
 * @param field - The Zod field to unwrap
 * @returns The unwrapped type
 */
export function getUnwrappedType(field: z.ZodTypeAny): z.ZodTypeAny {
  if (field instanceof z.ZodDefault) {
    // Don't unwrap defaults - we want to preserve them
    return field;
  }

  if ('unwrap' in field && typeof field.unwrap === 'function') {
    return getUnwrappedType(field.unwrap());
  }

  return field;
}

/**
 * Extract all default values from a Zod object schema
 * Recursively handles nested objects and only returns fields with defaults
 * @param schema - The Zod object schema to extract defaults from
 * @returns Partial object with only fields that have defaults
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().default('John'),
 *   age: z.number(), // no default - skipped
 *   settings: z.object({
 *     theme: z.string().default('light')
 *   })
 * });
 *
 * getSchemaDefaults(schema);
 * // Returns: { name: 'John', settings: { theme: 'light' } }
 * ```
 */
export function getSchemaDefaults<T extends z.ZodObject<any>>(
  schema: T,
): Partial<z.infer<T>> {
  const defaults: Record<string, any> = {};

  for (const key in schema.shape) {
    const field = schema.shape[key];

    // First, check if this field has an explicit default value
    const defaultValue = extractDefault(field);
    if (defaultValue !== undefined) {
      defaults[key] = defaultValue;
      continue;
    }

    // If no explicit default, check if it's a nested object with defaults
    const unwrapped = getUnwrappedType(field);
    if (unwrapped instanceof z.ZodObject) {
      const nestedDefaults = getSchemaDefaults(unwrapped);
      if (Object.keys(nestedDefaults).length > 0) {
        defaults[key] = nestedDefaults;
      }
    }
  }

  return defaults as Partial<z.infer<T>>;
}
