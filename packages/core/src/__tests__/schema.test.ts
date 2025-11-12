import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import {
  canUnwrap,
  getFieldChecks,
  getPrimitiveType,
  removeDefault,
  requiresValidInput,
  unwrapUnion,
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

  it('should unwrap direct union to get first primitive type', () => {
    const schema = z.union([z.string(), z.number()]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should handle union with object types', () => {
    const schema = z.union([
      z.object({ type: z.literal('a') }),
      z.object({ type: z.literal('b') }),
    ]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodObject);
  });

  it('should handle union with array as first option', () => {
    const schema = z.union([z.array(z.string()), z.number()]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodArray);
  });

  it('should handle union with literals', () => {
    const schema = z.union([z.literal('foo'), z.literal('bar')]);
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodLiteral);
  });

  it('should handle nested union wrapped in optional', () => {
    const schema = z.union([z.string(), z.number()]).optional();
    const result = getPrimitiveType(schema);
    expect(result).toBeInstanceOf(z.ZodString);
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
});

describe('unwrapUnion', () => {
  it('should unwrap a basic union and return first field and all options', () => {
    const schema = z.union([z.string(), z.number()]);
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodString);
    expect(result.union).toHaveLength(2);
    expect(result.union[0]).toBeInstanceOf(z.ZodString);
    expect(result.union[1]).toBeInstanceOf(z.ZodNumber);
  });

  it('should filter out null types by default', () => {
    const schema = z.union([z.string(), z.null()]);
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodString);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodString);
  });

  it('should filter out undefined types by default', () => {
    const schema = z.union([z.string(), z.undefined()]);
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodString);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodString);
  });

  it('should filter out both null and undefined by default', () => {
    const schema = z.union([z.string(), z.number(), z.null(), z.undefined()]);
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodString);
    expect(result.union).toHaveLength(2);
    expect(result.union[0]).toBeInstanceOf(z.ZodString);
    expect(result.union[1]).toBeInstanceOf(z.ZodNumber);
  });

  it('should keep null when filterNullish is false', () => {
    const schema = z.union([z.string(), z.null()]);
    const result = unwrapUnion(schema, { filterNullish: false });
    expect(result.field).toBeInstanceOf(z.ZodString);
    expect(result.union).toHaveLength(2);
    expect(result.union[0]).toBeInstanceOf(z.ZodString);
    expect(result.union[1]).toBeInstanceOf(z.ZodNull);
  });

  it('should keep undefined when filterNullish is false', () => {
    const schema = z.union([z.string(), z.undefined()]);
    const result = unwrapUnion(schema, { filterNullish: false });
    expect(result.field).toBeInstanceOf(z.ZodString);
    expect(result.union).toHaveLength(2);
    expect(result.union[0]).toBeInstanceOf(z.ZodString);
    expect(result.union[1]).toBeInstanceOf(z.ZodUndefined);
  });

  it('should return field and single-element union for non-union types', () => {
    const schema = z.string();
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodString);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodString);
  });

  it('should handle nullable (not a union, returns as-is)', () => {
    const schema = z.string().nullable();
    const result = unwrapUnion(schema);
    // .nullable() creates ZodNullable, not ZodUnion, so it returns as-is
    expect(result.field).toBeInstanceOf(z.ZodNullable);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodNullable);
  });

  it('should handle optional (non-union) types', () => {
    const schema = z.string().optional();
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodOptional);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodOptional);
  });

  it('should handle union with multiple types', () => {
    const schema = z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
    ]);
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodString);
    expect(result.union).toHaveLength(4);
    expect(result.union[0]).toBeInstanceOf(z.ZodString);
    expect(result.union[1]).toBeInstanceOf(z.ZodNumber);
    expect(result.union[2]).toBeInstanceOf(z.ZodBoolean);
    expect(result.union[3]).toBeInstanceOf(z.ZodArray);
  });

  it('should handle union with objects', () => {
    const schema = z.union([
      z.object({ type: z.literal('a') }),
      z.object({ type: z.literal('b') }),
    ]);
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodObject);
    expect(result.union).toHaveLength(2);
    expect(result.union[0]).toBeInstanceOf(z.ZodObject);
    expect(result.union[1]).toBeInstanceOf(z.ZodObject);
  });

  it('should handle union with literals', () => {
    const schema = z.union([z.literal('foo'), z.literal('bar')]);
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodLiteral);
    expect(result.union).toHaveLength(2);
    expect(result.union[0]).toBeInstanceOf(z.ZodLiteral);
    expect(result.union[1]).toBeInstanceOf(z.ZodLiteral);
  });

  it('should handle number types', () => {
    const schema = z.number();
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodNumber);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodNumber);
  });

  it('should handle boolean types', () => {
    const schema = z.boolean();
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodBoolean);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodBoolean);
  });

  it('should handle object types', () => {
    const schema = z.object({ foo: z.string() });
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodObject);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodObject);
  });

  it('should handle array types', () => {
    const schema = z.array(z.string());
    const result = unwrapUnion(schema);
    expect(result.field).toBeInstanceOf(z.ZodArray);
    expect(result.union).toHaveLength(1);
    expect(result.union[0]).toBeInstanceOf(z.ZodArray);
  });

  it('should destructure field and union correctly', () => {
    const schema = z.union([z.string(), z.number()]);
    const { field, union } = unwrapUnion(schema);
    expect(field).toBeInstanceOf(z.ZodString);
    expect(union).toHaveLength(2);
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

    it('should extract from first option of union', () => {
      const schema = z.union([z.string().min(3), z.number()]);
      expect(getFieldChecks(schema)).toMatchObject([
        { check: 'min_length', minimum: 3 },
      ]);
    });

    it('should ignore constraints in second union option', () => {
      const schema = z.union([z.string(), z.number().min(10)]);
      expect(getFieldChecks(schema)).toEqual([]);
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
});
