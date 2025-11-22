import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import {
  canUnwrap,
  extractDiscriminatedSchema,
  getFieldChecks,
  getPrimitiveType,
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

    it('should return empty array for union with multiple non-nullish types', () => {
      const schema = z.union([z.string().min(3), z.number()]);
      expect(getFieldChecks(schema)).toEqual([]);
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
        discriminatorField: 'mode',
        discriminatorValue: 'create',
      });

      expect(result).toBeDefined();
      expect(result?.shape.mode).toBeInstanceOf(z.ZodLiteral);
      expect(result?.shape.name).toBeInstanceOf(z.ZodString);
      expect(result?.shape.age).toBeDefined();
      expect(result?.shape.id).toBeUndefined();
      expect(result?.shape.bio).toBeUndefined();
    });

    it('should extract edit mode schema', () => {
      const result = extractDiscriminatedSchema({
        schema: userSchema,
        discriminatorField: 'mode',
        discriminatorValue: 'edit',
      });

      expect(result).toBeDefined();
      expect(result?.shape.mode).toBeInstanceOf(z.ZodLiteral);
      expect(result?.shape.id).toBeInstanceOf(z.ZodNumber);
      expect(result?.shape.name).toBeDefined();
      expect(result?.shape.bio).toBeDefined();
      expect(result?.shape.age).toBeUndefined();
    });

    it('should return undefined for invalid discriminator value', () => {
      const result = extractDiscriminatedSchema({
        schema: userSchema,
        discriminatorField: 'mode',
        // @ts-expect-error - testing invalid value
        discriminatorValue: 'invalid',
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
        discriminatorField: 'type',
        discriminatorValue: 'click',
      });

      expect(result).toBeDefined();
      expect(result?.shape.type).toBeInstanceOf(z.ZodLiteral);
      expect(result?.shape.x).toBeInstanceOf(z.ZodNumber);
      expect(result?.shape.y).toBeInstanceOf(z.ZodNumber);
    });

    it('should extract keypress event schema', () => {
      const result = extractDiscriminatedSchema({
        schema: eventSchema,
        discriminatorField: 'type',
        discriminatorValue: 'keypress',
      });

      expect(result).toBeDefined();
      expect(result?.shape.key).toBeInstanceOf(z.ZodString);
      expect(result?.shape.modifiers).toBeDefined();
    });

    it('should extract scroll event schema', () => {
      const result = extractDiscriminatedSchema({
        schema: eventSchema,
        discriminatorField: 'type',
        discriminatorValue: 'scroll',
      });

      expect(result).toBeDefined();
      expect(result?.shape.deltaX).toBeInstanceOf(z.ZodNumber);
      expect(result?.shape.deltaY).toBeInstanceOf(z.ZodNumber);
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
        discriminatorField: 'status',
        discriminatorValue: 'active',
      });

      expect(result).toBeDefined();
      expect(result?.shape.name).toBeInstanceOf(z.ZodDefault);
      expect(result?.shape.count).toBeInstanceOf(z.ZodDefault);
    });

    it('should extract inactive status schema', () => {
      const result = extractDiscriminatedSchema({
        schema: formSchema,
        discriminatorField: 'status',
        discriminatorValue: 'inactive',
      });

      expect(result).toBeDefined();
      expect(result?.shape.reason).toBeDefined();
      expect(result?.shape.name).toBeUndefined();
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
        discriminatorField: 'type',
        discriminatorValue: 'only',
      });

      expect(result).toBeDefined();
      expect(result?.shape.value).toBeInstanceOf(z.ZodString);
    });

    it('should work with numeric discriminator values', () => {
      const schema = z.discriminatedUnion('code', [
        z.object({ code: z.literal(200), message: z.string() }),
        z.object({ code: z.literal(404), error: z.string() }),
      ]);

      const result = extractDiscriminatedSchema({
        schema,
        discriminatorField: 'code',
        discriminatorValue: 200,
      });

      expect(result).toBeDefined();
      expect(result?.shape.message).toBeInstanceOf(z.ZodString);
    });

    it('should return undefined for missing discriminator field', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), value: z.string() }),
      ]);

      const result = extractDiscriminatedSchema({
        schema,
        // @ts-expect-error - testing wrong field
        discriminatorField: 'wrongField',
        discriminatorValue: 'a',
      });

      expect(result).toBeUndefined();
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
        discriminatorField: 'method',
        discriminatorValue: 'card',
      });

      expect(cardSchema).toBeDefined();
      expect(cardSchema?.shape.cardNumber).toBeDefined();
      expect(cardSchema?.shape.cvv).toBeDefined();
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
        discriminatorField: 'success',
        discriminatorValue: true,
      });

      const errorSchema = extractDiscriminatedSchema({
        schema: responseSchema,
        discriminatorField: 'success',
        discriminatorValue: false,
      });

      expect(successSchema).toBeDefined();
      expect(successSchema?.shape.data).toBeDefined();
      expect(errorSchema).toBeDefined();
      expect(errorSchema?.shape.error).toBeDefined();
    });
  });
});
