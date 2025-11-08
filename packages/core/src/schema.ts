import * as z from 'zod';

/**
 * Get the primitive type of a Zod field by unwrapping optional/nullable wrappers
 * @param field - The Zod field to unwrap
 * @param options - Options for unwrapping
 * @param options.unwrapArrays - If true, continues unwrapping arrays. If false (default), stops at arrays
 * @returns The unwrapped primitive type
 */
export const getPrimitiveType = <T extends z.ZodTypeAny>(
  field: T,
  options?: {
    unwrapArrays?: boolean;
  },
): z.ZodTypeAny => {
  const unwrapArrays = options?.unwrapArrays ?? false;

  if (!unwrapArrays && field.type === 'array') {
    return field;
  }

  if ('unwrap' in field && typeof field.unwrap === 'function') {
    return getPrimitiveType(field.unwrap());
  }

  return field;
};

/**
 * Remove default values from a Zod field
 * @param field - The Zod field to remove defaults from
 * @returns The field without defaults
 */
export function removeDefault(field: z.ZodType): z.ZodType {
  if (field instanceof z.ZodDefault) {
    return field.unwrap() as z.ZodType;
  }

  if ('innerType' in field.def) {
    const inner = removeDefault(field.def.innerType as z.ZodType);
    // Reconstruct the wrapper with the modified inner type
    if (field instanceof z.ZodOptional) {
      return inner.optional();
    }
    if (field instanceof z.ZodNullable) {
      return inner.nullable();
    }
  }

  return field;
}

/**
 * Check if a Zod field is required (not optional/nullable and doesn't accept empty values)
 * @param field - The Zod field to check
 * @returns True if the field is required
 */
export const checkIfFieldIsRequired = <T extends z.ZodTypeAny>(field: T) => {
  const undefinedResult = removeDefault(field).safeParse(undefined).success;
  const nullResult = field.safeParse(null).success;

  const primitiveType = getPrimitiveType(field);

  const emptyStringResult =
    primitiveType.type === 'string' && field.safeParse('').success;

  const emptyArrayResult =
    primitiveType.type === 'array' && field.safeParse([]).success;

  return (
    !undefinedResult && !nullResult && !emptyStringResult && !emptyArrayResult
  );
};
