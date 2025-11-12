import * as z from 'zod';
import type {
  $ZodCheckBigIntFormatDef,
  $ZodCheckEndsWithDef,
  $ZodCheckGreaterThanDef,
  $ZodCheckIncludesDef,
  $ZodCheckLengthEqualsDef,
  $ZodCheckLessThanDef,
  $ZodCheckLowerCaseDef,
  $ZodCheckMaxLengthDef,
  $ZodCheckMaxSizeDef,
  $ZodCheckMimeTypeDef,
  $ZodCheckMinLengthDef,
  $ZodCheckMinSizeDef,
  $ZodCheckMultipleOfDef,
  $ZodCheckNumberFormatDef,
  $ZodCheckOverwriteDef,
  $ZodCheckPropertyDef,
  $ZodCheckRegexDef,
  $ZodCheckSizeEqualsDef,
  $ZodCheckStartsWithDef,
  $ZodCheckStringFormatDef,
  $ZodCheckUpperCaseDef,
} from 'zod/v4/core';

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
 * Unwraps a ZodUnion type and returns the first field and all union options.
 *
 * This function extracts the individual type options from a union type.
 * By default, it filters out `ZodNull` and `ZodUndefined` types, returning only
 * the meaningful type options. You can disable this filtering to get all options.
 *
 * @template T - The Zod type to unwrap
 * @param field - The Zod field (union or single type)
 * @param options - Configuration options
 * @param options.filterNullish - Whether to filter out null and undefined types (default: true)
 * @returns Object with `field` (first option) and `union` (all options array)
 *
 * @example
 * Basic union unwrapping
 * ```typescript
 * const field = z.union([z.string(), z.number()]);
 * const result = unwrapUnion(field);
 * // Result: { field: z.string(), union: [z.string(), z.number()] }
 * ```
 *
 * @example
 * Union with null (filtered by default)
 * ```typescript
 * const field = z.union([z.string(), z.null()]);
 * const result = unwrapUnion(field);
 * // Result: { field: z.string(), union: [z.string()] }
 * ```
 *
 * @example
 * Union with null (keep all options)
 * ```typescript
 * const field = z.union([z.string(), z.null()]);
 * const result = unwrapUnion(field, { filterNullish: false });
 * // Result: { field: z.string(), union: [z.string(), z.null()] }
 * ```
 *
 * @example
 * Non-union type (returns single field)
 * ```typescript
 * const field = z.string();
 * const result = unwrapUnion(field);
 * // Result: { field: z.string(), union: [z.string()] }
 * ```
 *
 * @example
 * Nullable as union
 * ```typescript
 * const field = z.string().nullable(); // This is z.union([z.string(), z.null()])
 * const result = unwrapUnion(field);
 * // Result: { field: z.string(), union: [z.string()] } (null filtered out)
 * ```
 *
 * @example
 * Using the first field for type checking
 * ```typescript
 * const field = z.union([z.string(), z.number()]);
 * const { field: firstField, union } = unwrapUnion(field);
 * if (firstField instanceof z.ZodString) {
 *   console.log('First type is string');
 * }
 * ```
 *
 * @see {@link getPrimitiveType} for unwrapping wrapper types
 * @since 0.1.0
 */
export function unwrapUnion<T extends z.ZodTypeAny>(
  field: T,
  options: { filterNullish?: boolean } = {},
): { field: z.ZodTypeAny; union: z.ZodTypeAny[] } {
  const { filterNullish = true } = options;

  if (field instanceof z.ZodUnion) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const unionOptions = [...field.def.options] as z.ZodTypeAny[];

    const filteredOptions = filterNullish
      ? unionOptions.filter(
          (option) =>
            !(option instanceof z.ZodNull) &&
            !(option instanceof z.ZodUndefined),
        )
      : unionOptions;

    return {
      field: filteredOptions[0] || field,
      union: filteredOptions,
    };
  }

  // If it's not a union, return the field itself
  return {
    field,
    union: [field],
  };
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
export const getPrimitiveType = <T extends z.ZodType>(
  field: T,
): z.ZodTypeAny => {
  // Stop at arrays - don't unwrap them
  if (field instanceof z.ZodArray) {
    return field;
  }

  if (canUnwrap(field)) {
    return getPrimitiveType(field.unwrap());
  }

  if (field instanceof z.ZodUnion) {
    return getPrimitiveType(unwrapUnion(field).field);
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
 * @see {@link requiresValidInput} for usage with requirement checking
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
 * Determines if a field will show validation errors when the user submits empty or invalid input.
 *
 * This is useful for form UIs to indicate which fields require valid user input (e.g., showing
 * asterisks, validation states). The key insight: **defaults are just initial values** - they
 * don't prevent validation errors if the user clears the field.
 *
 * **Real-world example:**
 * ```typescript
 * // Marital status field with default but validation rules
 * const maritalStatus = z.string().min(1).default('single');
 *
 * // Initial: field shows "single" (from default)
 * // User deletes the value → field is now empty string
 * // User submits form → validation fails because .min(1) rejects empty strings
 * // requiresValidInput(maritalStatus) → true (shows * indicator, validation error)
 * ```
 *
 * **How it works:**
 * 1. Removes `.default()` wrappers (defaults are initial values, not validation rules)
 * 2. Tests if the underlying schema accepts empty/invalid input:
 *    - `undefined` (via `.optional()`)
 *    - `null` (via `.nullable()`)
 *    - Empty string (plain `z.string()` without `.min(1)` or `.nonempty()`)
 *    - Empty array (plain `z.array()` without `.min(1)` or `.nonempty()`)
 * 3. Returns `true` if validation will fail, `false` if empty input is accepted
 *
 * @template T - The Zod type to check
 * @param field - The Zod field to check
 * @returns True if the field will show validation errors on empty/invalid input, false otherwise
 *
 * @example
 * User name field - required, no default
 * ```typescript
 * const userName = z.string().min(1);
 * requiresValidInput(userName); // true - will error if user submits empty
 * ```
 *
 * @example
 * Marital status - required WITH default
 * ```typescript
 * const maritalStatus = z.string().min(1).default('single');
 * requiresValidInput(maritalStatus); // true - will error if user clears and submits
 * ```
 *
 * @example
 * Age with default - requires valid input
 * ```typescript
 * const age = z.number().default(0);
 * requiresValidInput(age); // true - numbers reject empty strings
 * ```
 *
 * @example
 * Optional bio field - doesn't require input
 * ```typescript
 * const bio = z.string().optional();
 * requiresValidInput(bio); // false - user can leave empty
 * ```
 *
 * @example
 * String with default but NO validation - doesn't require input
 * ```typescript
 * const notes = z.string().default('N/A');
 * requiresValidInput(notes); // false - plain z.string() accepts empty strings
 * ```
 *
 * @example
 * Nullable field - doesn't require input
 * ```typescript
 * const middleName = z.string().nullable();
 * requiresValidInput(middleName); // false - user can leave null
 * ```
 *
 * @see {@link removeDefault} for understanding how defaults are handled
 * @see {@link getPrimitiveType} for understanding type unwrapping
 * @since 0.1.0
 */
export const requiresValidInput = <T extends z.ZodType>(field: T) => {
  const defaultRemovedField = removeDefault(field);
  if (!(defaultRemovedField instanceof z.ZodType)) {
    return false;
  }

  const undefinedResult = defaultRemovedField.safeParse(undefined).success;

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

/**
 * Union type of all Zod check definition types.
 *
 * Includes all validation check types supported by Zod v4:
 * - **Length checks**: `min_length`, `max_length`, `length_equals` (strings, arrays)
 * - **Size checks**: `min_size`, `max_size`, `size_equals` (files, sets, maps)
 * - **Numeric checks**: `greater_than`, `less_than`, `multiple_of`
 * - **Format checks**: `number_format` (int32, float64, etc.), `bigint_format`, `string_format` (email, url, uuid, etc.)
 * - **String pattern checks**: `regex`, `lowercase`, `uppercase`, `includes`, `starts_with`, `ends_with`
 * - **Other checks**: `property`, `mime_type`, `overwrite`
 *
 * @since 0.4.0
 */
export type ZodUnionCheck =
  | $ZodCheckLessThanDef
  | $ZodCheckGreaterThanDef
  | $ZodCheckMultipleOfDef
  | $ZodCheckNumberFormatDef
  | $ZodCheckBigIntFormatDef
  | $ZodCheckMaxSizeDef
  | $ZodCheckMinSizeDef
  | $ZodCheckSizeEqualsDef
  | $ZodCheckMaxLengthDef
  | $ZodCheckMinLengthDef
  | $ZodCheckLengthEqualsDef
  | $ZodCheckStringFormatDef
  | $ZodCheckRegexDef
  | $ZodCheckLowerCaseDef
  | $ZodCheckUpperCaseDef
  | $ZodCheckIncludesDef
  | $ZodCheckStartsWithDef
  | $ZodCheckEndsWithDef
  | $ZodCheckPropertyDef
  | $ZodCheckMimeTypeDef
  | $ZodCheckOverwriteDef;

/**
 * Extracts all validation check definitions from a Zod schema field.
 *
 * This function analyzes a Zod field and returns all check definitions as defined
 * by Zod's internal structure. Returns Zod's raw check definition objects directly,
 * including all properties like `check`, `minimum`, `maximum`, `value`, `inclusive`,
 * `format`, `pattern`, etc.
 *
 * **Unwrapping behavior:** Automatically unwraps optional, nullable, and default layers.
 * For unions, checks only the first option (same as other schema utilities).
 *
 * **Supported check types:** Returns any of the 21 check types defined in {@link ZodUnionCheck},
 * including length, size, numeric range, format validation, string patterns, and more.
 *
 * @template T - The Zod type to extract checks from
 * @param field - The Zod field to analyze
 * @returns Array of Zod check definition objects (see {@link ZodUnionCheck})
 *
 * @example
 * String with length constraints
 * ```typescript
 * const username = z.string().min(3).max(20);
 * const checks = getFieldChecks(username);
 * // [
 * //   { check: 'min_length', minimum: 3, when: [Function], ... },
 * //   { check: 'max_length', maximum: 20, when: [Function], ... }
 * // ]
 * ```
 *
 * @example
 * Number with range constraints
 * ```typescript
 * const age = z.number().min(18).max(120);
 * const checks = getFieldChecks(age);
 * // [
 * //   { check: 'greater_than', value: 18, inclusive: true, when: [Function], ... },
 * //   { check: 'less_than', value: 120, inclusive: true, when: [Function], ... }
 * // ]
 * ```
 *
 * @example
 * Array with item count constraints
 * ```typescript
 * const tags = z.array(z.string()).min(1).max(5);
 * const checks = getFieldChecks(tags);
 * // [
 * //   { check: 'min_length', minimum: 1, ... },
 * //   { check: 'max_length', maximum: 5, ... }
 * // ]
 * ```
 *
 * @example
 * String with format validation
 * ```typescript
 * const email = z.string().email();
 * const checks = getFieldChecks(email);
 * // [
 * //   { check: 'string_format', format: 'email', ... }
 * // ]
 * ```
 *
 * @example
 * Unwrapping optional/nullable/default layers
 * ```typescript
 * const bio = z.string().min(10).max(500).optional();
 * const checks = getFieldChecks(bio);
 * // [
 * //   { check: 'min_length', minimum: 10, ... },
 * //   { check: 'max_length', maximum: 500, ... }
 * // ]
 * ```
 *
 * @see {@link ZodUnionCheck} for all supported check types
 * @since 0.4.0
 */
export function getFieldChecks<T extends z.ZodTypeAny>(
  field: T,
): Array<ZodUnionCheck> {
  const primitiveType = getPrimitiveType(field);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (primitiveType.def.checks?.map((check) => check._zod.def) ||
    []) as Array<ZodUnionCheck>;
}
