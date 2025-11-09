import * as z from 'zod';

/**
 * Type representing a Zod type that has an unwrap method
 */
type Unwrappable = { unwrap: () => z.ZodTypeAny };

/**
 * Type guard to check if a Zod field can be unwrapped (has wrapper types like optional, nullable, default).
 *
 * This checks whether a Zod type has an `unwrap()` method, which is present on wrapper types
 * like `ZodOptional`, `ZodNullable`, `ZodDefault`, and others.
 *
 * @param field - The Zod field to check
 * @returns True if the field has an unwrap method, false otherwise
 *
 * @example
 * ```typescript
 * const optionalField = z.string().optional();
 * console.log(canUnwrap(optionalField)); // true
 *
 * const plainField = z.string();
 * console.log(canUnwrap(plainField)); // false
 * ```
 *
 * @since 0.1.0
 */
export function canUnwrap(
  field: z.ZodTypeAny,
): field is z.ZodTypeAny & Unwrappable {
  return 'unwrap' in field && typeof field.unwrap === 'function';
}

/**
 * Gets the underlying primitive type of a Zod field by recursively unwrapping wrapper types.
 *
 * This function removes wrapper layers (optional, nullable, default) to reveal the base type.
 * **Important:** It stops at array types without unwrapping them, treating arrays as primitives.
 *
 * @template T - The Zod type to unwrap
 * @param field - The Zod field to unwrap
 * @returns The unwrapped primitive Zod type
 *
 * @example
 * Unwrapping to string primitive
 * ```typescript
 * const field = z.string().optional().nullable();
 * const primitive = getPrimitiveType(field);
 * // Result: z.string() (unwrapped all wrappers)
 * ```
 *
 * @example
 * Stopping at array type
 * ```typescript
 * const field = z.array(z.string()).optional();
 * const primitive = getPrimitiveType(field);
 * // Result: z.array(z.string()) (stops at array, doesn't unwrap it)
 * ```
 *
 * @example
 * Unwrapping defaults
 * ```typescript
 * const field = z.number().default(0).optional();
 * const primitive = getPrimitiveType(field);
 * // Result: z.number()
 * ```
 *
 * @see {@link canUnwrap} for checking if a field can be unwrapped
 * @since 0.1.0
 */
export const getPrimitiveType = <T extends z.ZodTypeAny>(
  field: T,
): z.ZodTypeAny => {
  // Stop at arrays - don't unwrap them
  if (field instanceof z.ZodArray) {
    return field;
  }

  if (canUnwrap(field)) {
    return getPrimitiveType(field.unwrap());
  }

  return field;
};

type StripZodDefault<T> = T extends z.ZodDefault<infer Inner>
  ? StripZodDefault<Inner>
  : T extends z.ZodOptional<infer Inner>
    ? z.ZodOptional<StripZodDefault<Inner>>
    : T extends z.ZodNullable<infer Inner>
      ? z.ZodNullable<StripZodDefault<Inner>>
      : T;

/**
 * Removes default values from a Zod field while preserving other wrapper types.
 *
 * This function recursively removes `ZodDefault` wrappers from a field, while maintaining
 * `optional()` and `nullable()` wrappers. Useful for scenarios where you want to check
 * field requirements without considering default values.
 *
 * @template T - The Zod type to process
 * @param field - The Zod field to remove defaults from
 * @returns The field without defaults but with optional/nullable preserved
 *
 * @example
 * Removing simple default
 * ```typescript
 * const field = z.string().default('hello');
 * const withoutDefault = removeDefault(field);
 * // Result: z.string()
 * ```
 *
 * @example
 * Preserving optional wrapper
 * ```typescript
 * const field = z.string().default('hello').optional();
 * const withoutDefault = removeDefault(field);
 * // Result: z.string().optional()
 * ```
 *
 * @example
 * Nested defaults
 * ```typescript
 * const field = z.string().default('inner').nullable().default('outer');
 * const withoutDefault = removeDefault(field);
 * // Result: z.string().nullable()
 * ```
 *
 * @see {@link checkIfFieldIsRequired} for usage with requirement checking
 * @since 0.1.0
 */
export function removeDefault<T extends z.ZodType>(
  field: T,
): StripZodDefault<T> {
  if (field instanceof z.ZodDefault) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return field.unwrap() as StripZodDefault<T>;
  }

  if ('innerType' in field.def && field.def.innerType instanceof z.ZodType) {
    const inner = removeDefault(field.def.innerType);
    // Reconstruct the wrapper with the modified inner type
    if (field instanceof z.ZodOptional) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return inner.optional() as unknown as StripZodDefault<T>;
    }
    if (field instanceof z.ZodNullable) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return inner.nullable() as unknown as StripZodDefault<T>;
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return field as StripZodDefault<T>;
}

/**
 * Checks if a Zod field is truly required by testing multiple acceptance criteria.
 *
 * A field is considered **not required** if it accepts any of the following:
 * - `undefined` (via `.optional()` or `.default()`)
 * - `null` (via `.nullable()`)
 * - Empty string (plain `z.string()` without `.min(1)` or `.nonempty()`)
 * - Empty array (plain `z.array()` without `.min(1)` or `.nonempty()`)
 *
 * **Note:** Fields with `.default()` are considered not required since they'll have a value
 * even if the user doesn't provide one.
 *
 * @template T - The Zod type to check
 * @param field - The Zod field to check for required status
 * @returns True if the field is required, false otherwise
 *
 * @example
 * Required field
 * ```typescript
 * const field = z.string().min(1);
 * console.log(checkIfFieldIsRequired(field)); // true
 * ```
 *
 * @example
 * Optional field (not required)
 * ```typescript
 * const field = z.string().optional();
 * console.log(checkIfFieldIsRequired(field)); // false
 * ```
 *
 * @example
 * Field with default (not required)
 * ```typescript
 * const field = z.string().default('hello');
 * console.log(checkIfFieldIsRequired(field)); // false
 * ```
 *
 * @example
 * String without min length (not required - accepts empty string)
 * ```typescript
 * const field = z.string();
 * console.log(checkIfFieldIsRequired(field)); // false
 * ```
 *
 * @example
 * String with nonempty (required)
 * ```typescript
 * const field = z.string().nonempty();
 * console.log(checkIfFieldIsRequired(field)); // true
 * ```
 *
 * @example
 * Nullable field (not required)
 * ```typescript
 * const field = z.number().nullable();
 * console.log(checkIfFieldIsRequired(field)); // false
 * ```
 *
 * @see {@link removeDefault} for understanding how defaults are handled
 * @see {@link getPrimitiveType} for understanding type unwrapping
 * @since 0.1.0
 */
export const checkIfFieldIsRequired = <T extends z.ZodType>(field: T) => {
  // First check the original field for undefined - this catches fields with defaults
  const undefinedResult = field.safeParse(undefined).success;
  if (undefinedResult) {
    return false;
  }

  const defaultRemovedField = removeDefault(field);

  if (!(defaultRemovedField instanceof z.ZodType)) {
    return false;
  }

  // Check if field accepts null (nullable)
  const nullResult = defaultRemovedField.safeParse(null).success;

  const primitiveType = getPrimitiveType(defaultRemovedField);

  const emptyStringResult =
    primitiveType.type === 'string' &&
    defaultRemovedField.safeParse('').success;

  const emptyArrayResult =
    primitiveType.type === 'array' && defaultRemovedField.safeParse([]).success;

  return (
    !undefinedResult && !nullResult && !emptyStringResult && !emptyArrayResult
  );
};
