import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { extractDiscriminatedSchema } from '../discriminatedSchema';
import {
  canUnwrap,
  getFieldChecks,
  getPrimitiveType,
  isPipeWithZodInput,
  removeDefault,
  requiresValidInput,
  tryStripNullishOnly,
} from '../schema';

describe('getPrimitiveType', () => {
  it('should return the primitive type for a simple string', () => {
    const schema = z.string();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should unwrap optional to get primitive type', () => {
    const schema = z.string().optional();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should unwrap nullable to get primitive type', () => {
    const schema = z.string().nullable();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should unwrap multiple levels of wrappers', () => {
    const schema = z.string().optional().nullable();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should unwrap default to get primitive type', () => {
    const schema = z.string().default('test');
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should stop at arrays', () => {
    const schema = z.array(z.string());
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodArray);
  });

  it('should stop at arrays even with wrappers', () => {
    const schema = z.array(z.string()).optional();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodArray);
  });

  it('should handle number types', () => {
    const schema = z.number().optional();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodNumber);
  });

  it('should handle boolean types', () => {
    const schema = z.boolean().nullable();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodBoolean);
  });

  it('should handle object types', () => {
    const schema = z.object({ foo: z.string() }).optional();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodObject);
  });

  it('should handle deeply nested wrappers', () => {
    const schema = z.string().default('test').optional().nullable();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should return union as-is for multiple non-nullish types', () => {
    const schema = z.union([z.string(), z.number()]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodUnion);
    expect(result).toBe(schema);
  });

  it('should unwrap union with nullish types to single type', () => {
    const schema = z.union([z.string(), z.null()]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should return union as-is for union with object types', () => {
    const schema = z.union([
      z.object({ type: z.literal('a') }),
      z.object({ type: z.literal('b') }),
    ]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodUnion);
    expect(result).toBe(schema);
  });

  it('should return union as-is for union with array as first option', () => {
    const schema = z.union([z.array(z.string()), z.number()]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodUnion);
    expect(result).toBe(schema);
  });

  it('should return union as-is for union with literals', () => {
    const schema = z.union([z.literal('foo'), z.literal('bar')]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodUnion);
    expect(result).toBe(schema);
  });

  it('should return union as-is for nested union wrapped in optional', () => {
    const schema = z.union([z.string(), z.number()]).optional();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodUnion);
  });

  it('should unwrap ZodPipe (transform) to get inner type', () => {
    const schema = z.string().transform((val) => val.toUpperCase());
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should unwrap nested ZodPipe with default', () => {
    const schema = z
      .string()
      .default('test')
      .transform((val) => val.toUpperCase());
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should unwrap ZodPipe from discriminated union', () => {
    const schema = z
      .discriminatedUnion('mode', [
        z.object({ mode: z.literal('a'), value: z.string() }),
        z.object({ mode: z.literal('b'), count: z.number() }),
      ])
      .transform((data) => ({ ...data, transformed: true }));
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodDiscriminatedUnion);
  });

  it('should unwrap ZodPipe from object', () => {
    const schema = z
      .object({ name: z.string() })
      .transform((data) => ({ ...data, id: 1 }));
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodObject);
  });
});

describe('removeDefault', () => {
  it('should remove default from ZodDefault', () => {
    const schema = z.string().default('test');
    const result = removeDefault(schema);
    expect(result).toBeInstanceOf(z.ZodString);
    expect(result.safeParse(undefined).success).toBe(false);
  });

  it('should return same type if no default', () => {
    const schema = z.string();
    const result = removeDefault(schema);
    expect(result).toBe(schema);
  });

  it('should remove default but keep optional', () => {
    const schema = z.string().default('test').optional();
    const result = removeDefault(schema);
    expect(result).toBeInstanceOf(z.ZodOptional);
    expect(result.safeParse(undefined).success).toBe(true);
  });

  it('should remove default but keep nullable', () => {
    const schema = z.string().default('test').nullable();
    const result = removeDefault(schema);
    expect(result).toBeInstanceOf(z.ZodNullable);
    expect(result.safeParse(null).success).toBe(true);
  });

  it('should handle deeply nested defaults', () => {
    const schema = z.string().default('test').optional().nullable();
    const result = removeDefault(schema);
    expect(result.safeParse(undefined).success).toBe(true);
    expect(result.safeParse(null).success).toBe(true);
  });

  it('should handle number defaults', () => {
    const schema = z.number().default(42);
    const result = removeDefault(schema);
    expect(result).toBeInstanceOf(z.ZodNumber);
  });

  it('should handle boolean defaults', () => {
    const schema = z.boolean().default(true);
    const result = removeDefault(schema);
    expect(result).toBeInstanceOf(z.ZodBoolean);
  });

  it('should handle object defaults', () => {
    const schema = z.object({ foo: z.string() }).default({ foo: 'bar' });
    const result = removeDefault(schema);
    expect(result).toBeInstanceOf(z.ZodObject);
  });

  it('should handle array defaults', () => {
    const schema = z.array(z.string()).default([]);
    const result = removeDefault(schema);
    expect(result).toBeInstanceOf(z.ZodArray);
  });

  it('should handle promise types with defaults', () => {
    const schema = z.promise(z.string().default('test'));
    const result = removeDefault(schema);
    // Promise type should still be a promise after removing inner default
    expect(result).toBeInstanceOf(z.ZodPromise);
  });

  describe('schemas with transforms', () => {
    it('should handle schema with transform (ZodPipe)', () => {
      const schema = z
        .string()
        .default('hello')
        .transform((val) => val.toUpperCase());
      const result = removeDefault(schema);
      // removeDefault doesn't unwrap ZodPipe, it works on the input schema
      expect(result).toBeInstanceOf(z.ZodPipe);
    });

    it('should remove default from schema before transform', () => {
      const schema = z
        .string()
        .default('test')
        .transform((val) => val.length);
      const result = removeDefault(schema);
      // The default is inside the ZodPipe's input, removeDefault returns ZodPipe as-is
      expect(result).toBeInstanceOf(z.ZodPipe);
    });

    it('should handle optional with transform', () => {
      const schema = z
        .string()
        .optional()
        .transform((val) => val ?? 'default');
      const result = removeDefault(schema);
      // No default to remove, returns as-is
      expect(result).toBeInstanceOf(z.ZodPipe);
    });

    it('should handle default after optional with transform', () => {
      const schema = z
        .string()
        .optional()
        .default('fallback')
        .transform((val) => val.toUpperCase());
      const result = removeDefault(schema);
      expect(result).toBeInstanceOf(z.ZodPipe);
    });
  });
});

describe('requiresValidInput', () => {
  it('should return false for basic string (empty strings allowed)', () => {
    const schema = z.string();
    // z.string() accepts empty strings by default
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return false for optional string', () => {
    const schema = z.string().optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return false for nullable string', () => {
    const schema = z.string().nullable();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return false for string with default', () => {
    const schema = z.string().default('test');
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return false for string that accepts empty string', () => {
    const schema = z.string();
    // Note: by default z.string() accepts empty strings
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return true for string with min length', () => {
    const schema = z.string().min(1);
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return false for optional string with min length', () => {
    const schema = z.string().min(1).optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return true for required number', () => {
    const schema = z.number();
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return false for optional number', () => {
    const schema = z.number().optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return true for number with default', () => {
    const schema = z.number().default(0);
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return true for required boolean', () => {
    const schema = z.boolean();
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return false for optional boolean', () => {
    const schema = z.boolean().optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return true for boolean with default', () => {
    const schema = z.boolean().default(false);
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return true for required object', () => {
    const schema = z.object({ foo: z.string() });
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return false for optional object', () => {
    const schema = z.object({ foo: z.string() }).optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return false for required array (empty arrays are valid)', () => {
    const schema = z.array(z.string());
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return true for array with min length', () => {
    const schema = z.array(z.string()).min(1);
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return true for array with nonempty', () => {
    const schema = z.array(z.string()).nonempty();
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return false for optional array', () => {
    const schema = z.array(z.string()).optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return false for array with default', () => {
    const schema = z.array(z.string()).default([]);
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should handle complex nested types', () => {
    const schema = z.string().optional().nullable();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return true for string with email validation', () => {
    const schema = z.string().email();
    // email() validation rejects empty strings
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should handle non-empty string', () => {
    const schema = z.string().nonempty();
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return false for optional non-empty string', () => {
    const schema = z.string().nonempty().optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should handle enum types', () => {
    const schema = z.enum(['a', 'b', 'c']);
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return false for optional enum', () => {
    const schema = z.enum(['a', 'b', 'c']).optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should handle literal types', () => {
    const schema = z.literal('test');
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should return false for optional literal', () => {
    const schema = z.literal('test').optional();
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should handle z.any() type', () => {
    const schema = z.any();
    // z.any() accepts everything including undefined, null, empty strings
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should handle z.unknown() type', () => {
    const schema = z.unknown();
    // z.unknown() accepts everything including undefined, null, empty strings
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should handle z.never() type', () => {
    const schema = z.never();
    // z.never() rejects everything
    expect(requiresValidInput(schema)).toBe(true);
  });

  it('should handle z.void() type', () => {
    const schema = z.void();
    // z.void() only accepts undefined
    expect(requiresValidInput(schema)).toBe(false);
  });

  it('should return false for malformed field', () => {
    // Create a malformed object that's not a proper ZodType
    const malformedField = {
      def: {},
      // Missing proper ZodType structure - not an instanceof z.ZodType
    };

    // @ts-expect-error - intentionally testing edge case with invalid input
    const result = requiresValidInput(malformedField);
    expect(result).toBe(false);
  });

  describe('schemas with transforms', () => {
    it('should return true for required string with transform', () => {
      const schema = z
        .string()
        .min(1)
        .transform((val) => val.toUpperCase());
      expect(requiresValidInput(schema)).toBe(true);
    });

    it('should return false for optional string with transform', () => {
      const schema = z
        .string()
        .optional()
        .transform((val) => val ?? 'default');
      expect(requiresValidInput(schema)).toBe(false);
    });

    it('should return true for required number with transform', () => {
      const schema = z.number().transform((val) => val * 2);
      expect(requiresValidInput(schema)).toBe(true);
    });

    it('should return false for nullable number with transform', () => {
      const schema = z
        .number()
        .nullable()
        .transform((val) => val ?? 0);
      expect(requiresValidInput(schema)).toBe(false);
    });

    it('should return false for plain string with transform (accepts empty)', () => {
      const schema = z.string().transform((val) => val.trim());
      expect(requiresValidInput(schema)).toBe(false);
    });

    it('should return true for string.min(1) with multiple transforms', () => {
      const schema = z
        .string()
        .min(1)
        .transform((val) => val.trim())
        .transform((val) => val.toLowerCase());
      expect(requiresValidInput(schema)).toBe(true);
    });

    it('should return true for boolean with transform', () => {
      const schema = z.boolean().transform((val) => (val ? 'yes' : 'no'));
      expect(requiresValidInput(schema)).toBe(true);
    });

    it('should return false for optional boolean with transform', () => {
      const schema = z
        .boolean()
        .optional()
        .transform((val) => val ?? false);
      expect(requiresValidInput(schema)).toBe(false);
    });

    it('should return false for array with transform (accepts empty)', () => {
      const schema = z.array(z.string()).transform((arr) => arr.join(','));
      expect(requiresValidInput(schema)).toBe(false);
    });

    it('should return true for array.min(1) with transform', () => {
      const schema = z
        .array(z.string())
        .min(1)
        .transform((arr) => arr.join(','));
      expect(requiresValidInput(schema)).toBe(true);
    });

    it('should handle transform with default - does not require input', () => {
      const schema = z
        .string()
        .min(1)
        .default('hello')
        .transform((val) => val.toUpperCase());
      // Has default, so it doesn't require valid input - default satisfies the constraint
      expect(requiresValidInput(schema)).toBe(false);
    });

    it('should require input for string.min(1) with transform and no default', () => {
      const schema = z
        .string()
        .min(1)
        .transform((val) => val.toUpperCase());
      // No default, min(1) requires non-empty string
      expect(requiresValidInput(schema)).toBe(true);
    });
  });
});

describe('tryStripNullishOnly', () => {
  describe('returns unwrapped type when only one option remains', () => {
    it('should unwrap union with only null stripped', () => {
      const schema = z.union([z.string(), z.null()]);
      const result = tryStripNullishOnly(schema);
      expect(result).not.toBe(false);
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should unwrap union with only undefined stripped', () => {
      const schema = z.union([z.string(), z.undefined()]);
      const result = tryStripNullishOnly(schema);
      expect(result).not.toBe(false);
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should unwrap union with both null and undefined stripped', () => {
      const schema = z.union([z.string(), z.null(), z.undefined()]);
      const result = tryStripNullishOnly(schema);
      expect(result).not.toBe(false);
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should unwrap union with number and null', () => {
      const schema = z.union([z.number(), z.null()]);
      const result = tryStripNullishOnly(schema);
      expect(result).not.toBe(false);
      expect(result).toBeInstanceOf(z.ZodNumber);
    });

    it('should unwrap union with boolean and undefined', () => {
      const schema = z.union([z.boolean(), z.undefined()]);
      const result = tryStripNullishOnly(schema);
      expect(result).not.toBe(false);
      expect(result).toBeInstanceOf(z.ZodBoolean);
    });
  });

  describe('returns false when cannot simplify to single type', () => {
    it('should return false for union with multiple non-nullish types', () => {
      const schema = z.union([z.string(), z.number()]);
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for union with multiple types and nullish', () => {
      const schema = z.union([z.string(), z.number(), z.null(), z.undefined()]);
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for union with objects', () => {
      const schema = z.union([
        z.object({ type: z.literal('a') }),
        z.object({ type: z.literal('b') }),
      ]);
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for union with literals', () => {
      const schema = z.union([z.literal('foo'), z.literal('bar')]);
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for union with mixed complex types', () => {
      const schema = z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
      ]);
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for non-union types', () => {
      expect(tryStripNullishOnly(z.string())).toBe(false);
      expect(tryStripNullishOnly(z.number())).toBe(false);
      expect(tryStripNullishOnly(z.boolean())).toBe(false);
      expect(tryStripNullishOnly(z.object({ foo: z.string() }))).toBe(false);
      expect(tryStripNullishOnly(z.array(z.string()))).toBe(false);
    });

    it('should return false for optional types (not unions)', () => {
      const schema = z.string().optional();
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for nullable types (not unions)', () => {
      const schema = z.string().nullable();
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for union with only nullish types', () => {
      const schema = z.union([z.null(), z.undefined()]);
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });
  });

  describe('schemas with transforms', () => {
    it('should return false for union with transform (not a union after transform)', () => {
      const schema = z
        .union([z.string(), z.null()])
        .transform((val) => val ?? 'default');
      const result = tryStripNullishOnly(schema);
      // After transform, it's a ZodPipe, not a ZodUnion
      expect(result).toBe(false);
    });

    it('should return false for plain string with transform', () => {
      const schema = z.string().transform((val) => val.toUpperCase());
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for object with transform', () => {
      const schema = z
        .object({ name: z.string() })
        .transform((data) => ({ ...data, processed: true }));
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });
  });

  describe('discriminated union schemas', () => {
    it('should return false for discriminated union (not nullish-only)', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), value: z.string() }),
        z.object({ type: z.literal('b'), count: z.number() }),
      ]);
      const result = tryStripNullishOnly(schema);
      // Discriminated unions have real options, not just nullish
      expect(result).toBe(false);
    });

    it('should return false for discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .transform((data) => ({ ...data, processed: true }));
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });

    it('should return false for optional discriminated union', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .optional();
      const result = tryStripNullishOnly(schema);
      expect(result).toBe(false);
    });
  });
});

describe('canUnwrap', () => {
  it('should return true for optional fields', () => {
    const schema = z.string().optional();
    expect(canUnwrap(schema)).toBe(true);
  });

  it('should return true for nullable fields', () => {
    const schema = z.string().nullable();
    expect(canUnwrap(schema)).toBe(true);
  });

  it('should return true for fields with default', () => {
    const schema = z.string().default('test');
    expect(canUnwrap(schema)).toBe(true);
  });

  it('should return false for plain string', () => {
    const schema = z.string();
    expect(canUnwrap(schema)).toBe(false);
  });

  it('should return false for plain number', () => {
    const schema = z.number();
    expect(canUnwrap(schema)).toBe(false);
  });

  it('should return true for wrapped array', () => {
    const schema = z.array(z.string()).optional();
    expect(canUnwrap(schema)).toBe(true);
  });

  it('should return false for plain object', () => {
    const schema = z.object({ foo: z.string() });
    expect(canUnwrap(schema)).toBe(false);
  });

  describe('schemas with transforms', () => {
    it('should return false for schema with transform (ZodPipe has no unwrap)', () => {
      const schema = z.string().transform((val) => val.toUpperCase());
      // ZodPipe doesn't have an unwrap method
      expect(canUnwrap(schema)).toBe(false);
    });

    it('should return false for optional schema with transform', () => {
      const schema = z
        .string()
        .optional()
        .transform((val) => val ?? 'default');
      // ZodPipe wraps the optional, but pipe itself doesn't have unwrap
      expect(canUnwrap(schema)).toBe(false);
    });

    it('should return false for schema with default and transform', () => {
      const schema = z
        .string()
        .default('hello')
        .transform((val) => val.toUpperCase());
      // ZodPipe doesn't have unwrap
      expect(canUnwrap(schema)).toBe(false);
    });

    it('should return false for schema with multiple transforms', () => {
      const schema = z
        .string()
        .transform((val) => val.trim())
        .transform((val) => val.toLowerCase());
      // Nested ZodPipe doesn't have unwrap
      expect(canUnwrap(schema)).toBe(false);
    });
  });

  describe('discriminated union schemas', () => {
    it('should return false for plain discriminated union', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), value: z.string() }),
        z.object({ type: z.literal('b'), count: z.number() }),
      ]);
      expect(canUnwrap(schema)).toBe(false);
    });

    it('should return true for optional discriminated union', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .optional();
      expect(canUnwrap(schema)).toBe(true);
    });

    it('should return false for discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .transform((data) => ({ ...data, processed: true }));
      // ZodPipe doesn't have unwrap
      expect(canUnwrap(schema)).toBe(false);
    });

    it('should return false for discriminated union with superRefine', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .superRefine(() => {});
      // superRefine doesn't change the type or add unwrap
      expect(canUnwrap(schema)).toBe(false);
    });
  });
});

describe('isPipeWithZodInput', () => {
  describe('normal schemas', () => {
    it('should return false for plain string', () => {
      const schema = z.string();
      expect(isPipeWithZodInput(schema)).toBe(false);
    });

    it('should return false for plain number', () => {
      const schema = z.number();
      expect(isPipeWithZodInput(schema)).toBe(false);
    });

    it('should return false for plain object', () => {
      const schema = z.object({ name: z.string() });
      expect(isPipeWithZodInput(schema)).toBe(false);
    });

    it('should return false for optional string', () => {
      const schema = z.string().optional();
      expect(isPipeWithZodInput(schema)).toBe(false);
    });

    it('should return false for string with default', () => {
      const schema = z.string().default('test');
      expect(isPipeWithZodInput(schema)).toBe(false);
    });
  });

  describe('schemas with transforms', () => {
    it('should return true for string with transform', () => {
      const schema = z.string().transform((val) => val.toUpperCase());
      expect(isPipeWithZodInput(schema)).toBe(true);
    });

    it('should return true for number with transform', () => {
      const schema = z.number().transform((val) => val * 2);
      expect(isPipeWithZodInput(schema)).toBe(true);
    });

    it('should return true for object with transform', () => {
      const schema = z
        .object({ name: z.string() })
        .transform((data) => ({ ...data, processed: true }));
      expect(isPipeWithZodInput(schema)).toBe(true);
    });

    it('should return true for schema with multiple transforms', () => {
      const schema = z
        .string()
        .transform((val) => val.trim())
        .transform((val) => val.toLowerCase());
      expect(isPipeWithZodInput(schema)).toBe(true);
    });

    it('should return true for optional with transform', () => {
      const schema = z
        .string()
        .optional()
        .transform((val) => val ?? 'default');
      expect(isPipeWithZodInput(schema)).toBe(true);
    });

    it('should return true for default with transform', () => {
      const schema = z
        .string()
        .default('hello')
        .transform((val) => val.toUpperCase());
      expect(isPipeWithZodInput(schema)).toBe(true);
    });
  });

  describe('discriminated union schemas', () => {
    it('should return false for plain discriminated union', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), value: z.string() }),
        z.object({ type: z.literal('b'), count: z.number() }),
      ]);
      expect(isPipeWithZodInput(schema)).toBe(false);
    });

    it('should return true for discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .transform((data) => ({ ...data, processed: true }));
      expect(isPipeWithZodInput(schema)).toBe(true);
    });

    it('should return false for discriminated union with superRefine (not a ZodPipe)', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .superRefine(() => {});
      // superRefine doesn't create a ZodPipe, it modifies the schema in place
      expect(isPipeWithZodInput(schema)).toBe(false);
    });

    it('should return true for discriminated union with superRefine and transform', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .superRefine(() => {})
        .transform((data) => data);
      expect(isPipeWithZodInput(schema)).toBe(true);
    });
  });
});

describe('getFieldChecks', () => {
  describe('string validations', () => {
    it('should extract min length constraint', () => {
      const schema = z.string().min(3);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 3 },
      ]);
    });

    it('should extract max length constraint', () => {
      const schema = z.string().max(100);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'max_length', maximum: 100 },
      ]);
    });

    it('should extract both min and max length', () => {
      const schema = z.string().min(3).max(20);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 3 },
        { check: 'max_length', maximum: 20 },
      ]);
    });

    it('should extract exact length constraint', () => {
      const schema = z.string().length(10);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'length_equals', length: 10 },
      ]);
    });
  });

  describe('number validations', () => {
    it('should extract min value constraint', () => {
      const schema = z.number().min(18);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'greater_than', value: 18, inclusive: true },
      ]);
    });

    it('should extract max value constraint', () => {
      const schema = z.number().max(120);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'less_than', value: 120, inclusive: true },
      ]);
    });

    it('should extract both min and max value', () => {
      const schema = z.number().min(18).max(120);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'greater_than', value: 18, inclusive: true },
        { check: 'less_than', value: 120, inclusive: true },
      ]);
    });
  });

  describe('array validations', () => {
    it('should extract min items constraint', () => {
      const schema = z.array(z.string()).min(1);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 1 },
      ]);
    });

    it('should extract max items constraint', () => {
      const schema = z.array(z.string()).max(10);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'max_length', maximum: 10 },
      ]);
    });

    it('should extract both min and max items', () => {
      const schema = z.array(z.string()).min(1).max(5);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 1 },
        { check: 'max_length', maximum: 5 },
      ]);
    });
  });

  describe('date validations', () => {
    it('should extract min date constraint', () => {
      const minDate = new Date('2024-01-01');
      const schema = z.date().min(minDate);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'greater_than', value: minDate, inclusive: true },
      ]);
    });

    it('should extract max date constraint', () => {
      const maxDate = new Date('2024-12-31');
      const schema = z.date().max(maxDate);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'less_than', value: maxDate, inclusive: true },
      ]);
    });

    it('should extract both min and max date', () => {
      const minDate = new Date('2024-01-01');
      const maxDate = new Date('2024-12-31');
      const schema = z.date().min(minDate).max(maxDate);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'greater_than', value: minDate, inclusive: true },
        { check: 'less_than', value: maxDate, inclusive: true },
      ]);
    });
  });

  describe('unwrapping behavior', () => {
    it('should unwrap optional fields', () => {
      const schema = z.string().min(3).max(20).optional();
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 3 },
        { check: 'max_length', maximum: 20 },
      ]);
    });

    it('should unwrap nullable fields', () => {
      const schema = z.number().min(0).max(100).nullable();
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'greater_than', value: 0, inclusive: true },
        { check: 'less_than', value: 100, inclusive: true },
      ]);
    });

    it('should unwrap fields with defaults', () => {
      const schema = z.string().min(5).max(50).default('test');
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 5 },
        { check: 'max_length', maximum: 50 },
      ]);
    });

    it('should unwrap multiple layers', () => {
      const schema = z
        .string()
        .min(10)
        .max(500)
        .optional()
        .nullable()
        .default('test');
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 10 },
        { check: 'max_length', maximum: 500 },
      ]);
    });

    it('should collect checks from all union options', () => {
      const schema = z.union([z.string().min(3), z.number()]);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 3 },
      ]);
    });

    it('should collect checks from second union option', () => {
      const schema = z.union([z.string(), z.number().min(10)]);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'greater_than', value: 10 },
      ]);
    });
  });

  describe('fields with no constraints', () => {
    it('should return empty array for plain string', () => {
      const schema = z.string();
      expect(getFieldChecks(schema)).toEqual([]);
    });

    it('should return empty array for plain number', () => {
      const schema = z.number();
      expect(getFieldChecks(schema)).toEqual([]);
    });

    it('should return empty array for plain array', () => {
      const schema = z.array(z.string());
      expect(getFieldChecks(schema)).toEqual([]);
    });

    it('should return empty array for plain date', () => {
      const schema = z.date();
      expect(getFieldChecks(schema)).toEqual([]);
    });

    it('should return empty array for object', () => {
      const schema = z.object({ name: z.string() });
      expect(getFieldChecks(schema)).toEqual([]);
    });

    it('should return empty array for boolean', () => {
      const schema = z.boolean();
      expect(getFieldChecks(schema)).toEqual([]);
    });
  });

  describe('complex real-world examples', () => {
    it('should extract constraints from username field', () => {
      const schema = z.string().min(3).max(20);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 3 },
        { check: 'max_length', maximum: 20 },
      ]);
    });

    it('should extract constraints from email field', () => {
      const schema = z.string().max(255).optional();
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'max_length', maximum: 255 },
      ]);
    });

    it('should extract constraints from age field', () => {
      const schema = z.number().min(18).max(120).default(25);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'greater_than', value: 18, inclusive: true },
        { check: 'less_than', value: 120, inclusive: true },
      ]);
    });

    it('should extract constraints from tags field', () => {
      const schema = z.array(z.string()).min(1).max(5).default([]);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 1 },
        { check: 'max_length', maximum: 5 },
      ]);
    });

    it('should extract constraints from bio field', () => {
      const schema = z.string().min(10).max(500).optional();
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 10 },
        { check: 'max_length', maximum: 500 },
      ]);
    });
  });

  describe('schemas with transforms', () => {
    it('should extract checks from string with transform', () => {
      const schema = z
        .string()
        .min(3)
        .max(100)
        .transform((val) => val.toUpperCase());
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 3 },
        { check: 'max_length', maximum: 100 },
      ]);
    });

    it('should extract checks from number with transform', () => {
      const schema = z
        .number()
        .min(0)
        .max(100)
        .transform((val) => val * 2);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'greater_than', value: 0, inclusive: true },
        { check: 'less_than', value: 100, inclusive: true },
      ]);
    });

    it('should extract checks from string with multiple transforms', () => {
      const schema = z
        .string()
        .min(5)
        .transform((val) => val.trim())
        .transform((val) => val.toLowerCase());
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 5 },
      ]);
    });

    it('should extract checks from optional field with transform', () => {
      const schema = z
        .string()
        .min(1)
        .max(50)
        .optional()
        .transform((val) => val ?? 'default');
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 1 },
        { check: 'max_length', maximum: 50 },
      ]);
    });

    it('should extract checks from url with transform', () => {
      const schema = z
        .url()
        .max(200)
        .transform((val) => new URL(val));
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'string_format', format: 'url' },
        { check: 'max_length', maximum: 200 },
      ]);
    });

    it('should extract checks from email with transform', () => {
      const schema = z.email().transform((val) => val.toLowerCase());
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'string_format', format: 'email' },
      ]);
    });

    it('should extract checks from array with transform', () => {
      const schema = z
        .array(z.string())
        .min(1)
        .max(10)
        .transform((arr) => arr.join(','));
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 1 },
        { check: 'max_length', maximum: 10 },
      ]);
    });
  });

  describe('discriminated union schemas', () => {
    it('should return empty array for plain discriminated union', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), value: z.string() }),
        z.object({ type: z.literal('b'), count: z.number() }),
      ]);
      // Discriminated unions don't have field-level checks at the union level
      expect(getFieldChecks(schema)).toEqual([]);
    });

    it('should return empty array for discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string().min(1) }),
          z.object({ type: z.literal('b'), count: z.number().min(0) }),
        ])
        .transform((data) => ({ ...data, processed: true }));
      // Union-level checks are empty, individual field checks are on nested schemas
      expect(getFieldChecks(schema)).toEqual([]);
    });

    it('should return empty array for discriminated union with superRefine', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .superRefine(() => {});
      expect(getFieldChecks(schema)).toEqual([]);
    });

    it('should return empty array for optional discriminated union', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ])
        .optional();
      expect(getFieldChecks(schema)).toEqual([]);
    });
  });
});

describe('extractDiscriminatedSchema', () => {
  describe('basic mode-based discrimination', () => {
    const userSchema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        name: z.string(),
        age: z.number().optional(),
      }),
      z.object({
        mode: z.literal('edit'),
        id: z.number(),
        name: z.string().optional(),
        bio: z.string().optional(),
      }),
    ]);

    it('should extract create mode schema', () => {
      const result = extractDiscriminatedSchema({
        schema: userSchema,
        discriminator: { key: 'mode', value: 'create' },
      });

      expect(result).toBeDefined();
      expect(result.shape.mode).toBeInstanceOf(z.ZodLiteral);
      expect(result.shape.name).toBeInstanceOf(z.ZodString);
      expect(result.shape.age).toBeDefined();
      // @ts-expect-error - testing that property doesn't exist
      expect(result.shape.id).toBeUndefined();
      // @ts-expect-error - testing that property doesn't exist
      expect(result.shape.bio).toBeUndefined();
    });

    it('should extract edit mode schema', () => {
      const result = extractDiscriminatedSchema({
        schema: userSchema,
        discriminator: { key: 'mode', value: 'edit' },
      });

      expect(result).toBeDefined();
      expect(result.shape.mode).toBeInstanceOf(z.ZodLiteral);
      expect(result.shape.id).toBeInstanceOf(z.ZodNumber);
      expect(result.shape.name).toBeDefined();
      expect(result.shape.bio).toBeDefined();
      // @ts-expect-error - testing that property doesn't exist
      expect(result.shape.age).toBeUndefined();
    });

    it('should return undefined for invalid discriminator value', () => {
      const result = extractDiscriminatedSchema({
        schema: userSchema,
        // @ts-expect-error - testing invalid value
        discriminator: { key: 'mode', value: 'invalid' },
      });

      expect(result).toBeUndefined();
    });
  });

  describe('type-based discrimination', () => {
    const eventSchema = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('click'),
        x: z.number(),
        y: z.number(),
      }),
      z.object({
        type: z.literal('keypress'),
        key: z.string(),
        modifiers: z.array(z.string()).optional(),
      }),
      z.object({
        type: z.literal('scroll'),
        deltaX: z.number(),
        deltaY: z.number(),
      }),
    ]);

    it('should extract click event schema', () => {
      const result = extractDiscriminatedSchema({
        schema: eventSchema,
        discriminator: { key: 'type', value: 'click' },
      });

      expect(result).toBeDefined();
      expect(result.shape.type).toBeInstanceOf(z.ZodLiteral);
      expect(result.shape.x).toBeInstanceOf(z.ZodNumber);
      expect(result.shape.y).toBeInstanceOf(z.ZodNumber);
    });

    it('should extract keypress event schema', () => {
      const result = extractDiscriminatedSchema({
        schema: eventSchema,
        discriminator: { key: 'type', value: 'keypress' },
      });

      expect(result).toBeDefined();
      expect(result.shape.key).toBeInstanceOf(z.ZodString);
      expect(result.shape.modifiers).toBeDefined();
    });

    it('should extract scroll event schema', () => {
      const result = extractDiscriminatedSchema({
        schema: eventSchema,
        discriminator: { key: 'type', value: 'scroll' },
      });

      expect(result).toBeDefined();
      expect(result.shape.deltaX).toBeInstanceOf(z.ZodNumber);
      expect(result.shape.deltaY).toBeInstanceOf(z.ZodNumber);
    });
  });

  describe('with defaults', () => {
    const formSchema = z.discriminatedUnion('status', [
      z.object({
        status: z.literal('active'),
        name: z.string().default('User'),
        count: z.number().default(0),
      }),
      z.object({
        status: z.literal('inactive'),
        reason: z.string().optional(),
      }),
    ]);

    it('should extract active status schema with defaults', () => {
      const result = extractDiscriminatedSchema({
        schema: formSchema,
        discriminator: { key: 'status', value: 'active' },
      });

      expect(result).toBeDefined();
      expect(result.shape.name).toBeInstanceOf(z.ZodDefault);
      expect(result.shape.count).toBeInstanceOf(z.ZodDefault);
    });

    it('should extract inactive status schema', () => {
      const result = extractDiscriminatedSchema({
        schema: formSchema,
        discriminator: { key: 'status', value: 'inactive' },
      });

      expect(result).toBeDefined();
      expect(result.shape.reason).toBeDefined();
      // @ts-expect-error - testing that property doesn't exist
      expect(result.shape.name).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should work with single option union', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('only'),
          value: z.string(),
        }),
      ]);

      const result = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'type', value: 'only' },
      });

      expect(result).toBeDefined();
      expect(result.shape.value).toBeInstanceOf(z.ZodString);
    });

    it('should work with numeric discriminator values', () => {
      const schema = z.discriminatedUnion('code', [
        z.object({ code: z.literal(200), message: z.string() }),
        z.object({ code: z.literal(404), error: z.string() }),
      ]);

      const result = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'code', value: 200 },
      });

      expect(result).toBeDefined();
      expect(result.shape.message).toBeInstanceOf(z.ZodString);
    });

    it('should return undefined for missing discriminator field', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), value: z.string() }),
      ]);

      const result = extractDiscriminatedSchema({
        schema,
        // @ts-expect-error - testing wrong field
        discriminator: { key: 'wrongField', value: 'a' },
      });

      expect(result).toBeUndefined();
    });

    it('should handle non-ZodObject options in union', () => {
      // Create a discriminated union
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), value: z.string() }),
      ]);

      // Manually inject a non-ZodObject at the beginning of the options array
      // This tests the runtime check: if (option instanceof z.ZodObject)
      const nonObjectOption = z.string();
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (schema.options as Array<unknown>).unshift(nonObjectOption);

      // Should skip the non-ZodObject and find the correct object option
      const result = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'type', value: 'a' },
      });

      expect(result).toBeDefined();
      expect(result.shape.value).toBeInstanceOf(z.ZodString);
    });
  });

  describe('type narrowing', () => {
    it('should return exact schema type, not union', () => {
      const schema = z.discriminatedUnion('mode', [
        z.object({
          mode: z.literal('create'),
          name: z.string(),
          age: z.number(),
        }),
        z.object({
          mode: z.literal('edit'),
          id: z.number(),
          bio: z.string(),
        }),
      ]);

      const createSchema = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'mode', value: 'create' },
      });

      const editSchema = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'mode', value: 'edit' },
      });

      // Runtime checks
      expect(createSchema).toBeDefined();
      expect(editSchema).toBeDefined();

      // Type-level checks - these should compile without errors
      createSchema.shape.mode; // ✅ 'mode' exists
      createSchema.shape.name; // ✅ 'name' exists
      createSchema.shape.age; // ✅ 'age' exists
      // @ts-expect-error - 'id' doesn't exist on 'create' schema
      createSchema.shape.id;
      // @ts-expect-error - 'bio' doesn't exist on 'create' schema
      createSchema.shape.bio;

      editSchema.shape.mode; // ✅ 'mode' exists
      editSchema.shape.id; // ✅ 'id' exists
      editSchema.shape.bio; // ✅ 'bio' exists
      // @ts-expect-error - 'name' doesn't exist on 'edit' schema
      editSchema.shape.name;
      // @ts-expect-error - 'age' doesn't exist on 'edit' schema
      editSchema.shape.age;
    });

    it('should work with inferred types', () => {
      const schema = z.discriminatedUnion('status', [
        z.object({ status: z.literal('active'), count: z.number() }),
        z.object({ status: z.literal('inactive'), reason: z.string() }),
      ]);

      const activeSchema = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'status', value: 'active' },
      });

      // Type inference check
      type InferredType = z.infer<typeof activeSchema>;
      const value: InferredType = {
        status: 'active',
        count: 42,
      };
      expect(value.status).toBe('active');
    });
  });

  describe('real-world scenarios', () => {
    it('should work with payment method discrimination', () => {
      const paymentSchema = z.discriminatedUnion('method', [
        z.object({
          method: z.literal('card'),
          cardNumber: z.string(),
          cvv: z.string(),
          expiryDate: z.string(),
        }),
        z.object({
          method: z.literal('paypal'),
          email: z.string(),
        }),
        z.object({
          method: z.literal('bank'),
          accountNumber: z.string(),
          routingNumber: z.string(),
        }),
      ]);

      const cardSchema = extractDiscriminatedSchema({
        schema: paymentSchema,
        discriminator: { key: 'method', value: 'card' },
      });

      expect(cardSchema).toBeDefined();
      expect(cardSchema.shape.cardNumber).toBeDefined();
      expect(cardSchema.shape.cvv).toBeDefined();
    });

    it('should work with API response discrimination', () => {
      const responseSchema = z.discriminatedUnion('success', [
        z.object({
          success: z.literal(true),
          data: z.object({ id: z.number(), name: z.string() }),
        }),
        z.object({
          success: z.literal(false),
          error: z.string(),
          code: z.number(),
        }),
      ]);

      const successSchema = extractDiscriminatedSchema({
        schema: responseSchema,
        discriminator: { key: 'success', value: true },
      });

      const errorSchema = extractDiscriminatedSchema({
        schema: responseSchema,
        discriminator: { key: 'success', value: false },
      });

      expect(successSchema).toBeDefined();
      expect(successSchema.shape.data).toBeDefined();
      expect(errorSchema).toBeDefined();
      expect(errorSchema.shape.error).toBeDefined();
    });
  });

  describe('schemas with transforms', () => {
    it('should extract schema from discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('mode', [
          z.object({
            mode: z.literal('create'),
            name: z.string(),
            age: z.number().optional(),
          }),
          z.object({
            mode: z.literal('edit'),
            id: z.number(),
            bio: z.string().optional(),
          }),
        ])
        .transform((data) => ({ ...data, timestamp: Date.now() }));

      const createSchema = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'mode', value: 'create' },
      });

      expect(createSchema).toBeDefined();
      expect(createSchema.shape.mode).toBeDefined();
      expect(createSchema.shape.name).toBeDefined();
      expect(createSchema.shape.age).toBeDefined();
    });

    it('should extract schema from discriminated union with superRefine', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('a'),
            value: z.string(),
          }),
          z.object({
            type: z.literal('b'),
            count: z.number(),
          }),
        ])
        .superRefine(() => {});

      const result = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'type', value: 'b' },
      });

      expect(result).toBeDefined();
      expect(result.shape.type).toBeDefined();
      expect(result.shape.count).toBeDefined();
    });

    it('should extract schema from discriminated union with superRefine and transform', () => {
      const schema = z
        .discriminatedUnion('status', [
          z.object({
            status: z.literal('active'),
            name: z.string(),
          }),
          z.object({
            status: z.literal('inactive'),
            reason: z.string(),
          }),
        ])
        .superRefine(() => {})
        .transform((data) => data);

      const activeSchema = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'status', value: 'active' },
      });

      const inactiveSchema = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'status', value: 'inactive' },
      });

      expect(activeSchema).toBeDefined();
      expect(activeSchema.shape.name).toBeDefined();
      expect(inactiveSchema).toBeDefined();
      expect(inactiveSchema.shape.reason).toBeDefined();
    });

    it('should extract schema from discriminated union with multiple transforms', () => {
      const schema = z
        .discriminatedUnion('kind', [
          z.object({
            kind: z.literal('one'),
            x: z.number(),
          }),
          z.object({
            kind: z.literal('two'),
            y: z.string(),
          }),
        ])
        .transform((data) => ({ ...data, step: 1 }))
        .transform((data) => ({ ...data, step: 2 }));

      const result = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'kind', value: 'one' },
      });

      expect(result).toBeDefined();
      expect(result.shape.kind).toBeDefined();
      expect(result.shape.x).toBeDefined();
    });

    it('should extract schema from discriminated union with refine', () => {
      const schema = z
        .discriminatedUnion('action', [
          z.object({
            action: z.literal('create'),
            title: z.string(),
          }),
          z.object({
            action: z.literal('delete'),
            id: z.number(),
          }),
        ])
        .refine((data) => data.action === 'create' || data.id > 0);

      const result = extractDiscriminatedSchema({
        schema,
        discriminator: { key: 'action', value: 'delete' },
      });

      expect(result).toBeDefined();
      expect(result.shape.action).toBeDefined();
      expect(result.shape.id).toBeDefined();
    });
  });

  describe('non-discriminated union schemas', () => {
    // These tests verify runtime behavior when incompatible schema types are passed
    // We use type assertions to bypass TypeScript's strict type checking for testing purposes
    /* eslint-disable @typescript-eslint/consistent-type-assertions */
    it('should return undefined for plain object schema', () => {
      const plainSchema = z.object({
        name: z.string(),
        age: z.number(),
      });

      // Testing runtime behavior with incompatible type
      const result = extractDiscriminatedSchema({
        schema: plainSchema,
        discriminator: { key: 'mode', value: 'create' },
        // biome-ignore lint/suspicious/noExplicitAny: testing runtime behavior with incompatible type
      } as any);

      expect(result).toBeUndefined();
    });

    it('should return undefined for regular union schema', () => {
      const regularUnion = z.union([z.string(), z.number()]);

      // Testing runtime behavior with incompatible type
      const result = extractDiscriminatedSchema({
        schema: regularUnion,
        discriminator: { key: 'type', value: 'string' },
        // biome-ignore lint/suspicious/noExplicitAny: testing runtime behavior with incompatible type
      } as any);

      expect(result).toBeUndefined();
    });

    it('should return undefined for array schema', () => {
      const arraySchema = z.array(z.string());

      // Testing runtime behavior with incompatible type
      const result = extractDiscriminatedSchema({
        schema: arraySchema,
        discriminator: { key: 'mode', value: 'create' },
        // biome-ignore lint/suspicious/noExplicitAny: testing runtime behavior with incompatible type
      } as any);

      expect(result).toBeUndefined();
    });
    /* eslint-enable @typescript-eslint/consistent-type-assertions */
  });
});
