import * as z from 'zod';

/**
 * Get the primitive type of a Zod field by unwrapping optional/nullable wrappers
 * @param field - The Zod field to unwrap
 * @param options - Options for unwrapping
 * @param options.unwrapArrays - If true, continues unwrapping arrays. If false (default), stops at arrays
 * @returns The unwrapped primitive type
 */
declare const getPrimitiveType: <T extends z.ZodTypeAny>(field: T, options?: {
    unwrapArrays?: boolean;
}) => z.ZodTypeAny;
/**
 * Remove default values from a Zod field
 * @param field - The Zod field to remove defaults from
 * @returns The field without defaults
 */
declare function removeDefault(field: z.ZodType): z.ZodType;
/**
 * Check if a Zod field is required (not optional/nullable and doesn't accept empty values)
 * @param field - The Zod field to check
 * @returns True if the field is required
 */
declare const checkIfFieldIsRequired: <T extends z.ZodTypeAny>(field: T) => boolean;

/**
 * Extract the default value from a Zod field (recursively unwraps optional/nullable)
 * @param field - The Zod field to extract default from
 * @returns The default value if present, undefined otherwise
 */
declare function extractDefault(field: z.ZodTypeAny): any;
/**
 * Get the unwrapped type without going through defaults
 * Useful for detecting nested objects/arrays while preserving defaults
 * @param field - The Zod field to unwrap
 * @returns The unwrapped type
 */
declare function getUnwrappedType(field: z.ZodTypeAny): z.ZodTypeAny;
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
declare function getSchemaDefaults<T extends z.ZodObject<any>>(schema: T): Partial<z.infer<T>>;

/**
 * Extract the element type from an array or undefined
 */
type PickArrayObject<TArray extends unknown[] | undefined> = NonNullable<TArray>[number];
/**
 * Simplify complex types for better IDE hints
 */
type Simplify<T> = {
    [K in keyof T]: T[K];
} & {};
/**
 * Make all properties optional and nullable
 * Useful for form input types where fields can be empty
 */
type MakeOptionalAndNullable<T> = {
    [K in keyof T]?: T[K] | null;
};

export { type MakeOptionalAndNullable, type PickArrayObject, type Simplify, checkIfFieldIsRequired, extractDefault, getPrimitiveType, getSchemaDefaults, getUnwrappedType, removeDefault };
