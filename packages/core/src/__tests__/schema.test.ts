import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import {
  checkIfFieldIsRequired,
  getPrimitiveType,
  removeDefault,
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

describe('checkIfFieldIsRequired', () => {
  it('should return false for basic string (empty strings allowed)', () => {
    const schema = z.string();
    // z.string() accepts empty strings by default
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return false for optional string', () => {
    const schema = z.string().optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return false for nullable string', () => {
    const schema = z.string().nullable();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return false for string with default', () => {
    const schema = z.string().default('test');
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return false for string that accepts empty string', () => {
    const schema = z.string();
    // Note: by default z.string() accepts empty strings
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return true for string with min length', () => {
    const schema = z.string().min(1);
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should return false for optional string with min length', () => {
    const schema = z.string().min(1).optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return true for required number', () => {
    const schema = z.number();
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should return false for optional number', () => {
    const schema = z.number().optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return false for number with default', () => {
    const schema = z.number().default(0);
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return true for required boolean', () => {
    const schema = z.boolean();
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should return false for optional boolean', () => {
    const schema = z.boolean().optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return false for boolean with default', () => {
    const schema = z.boolean().default(false);
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return true for required object', () => {
    const schema = z.object({ foo: z.string() });
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should return false for optional object', () => {
    const schema = z.object({ foo: z.string() }).optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return false for required array (empty arrays are valid)', () => {
    const schema = z.array(z.string());
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return true for array with min length', () => {
    const schema = z.array(z.string()).min(1);
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should return false for optional array', () => {
    const schema = z.array(z.string()).optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return false for array with default', () => {
    const schema = z.array(z.string()).default([]);
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should handle complex nested types', () => {
    const schema = z.string().optional().nullable();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should return true for string with email validation', () => {
    const schema = z.string().email();
    // email() validation rejects empty strings
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should handle non-empty string', () => {
    const schema = z.string().nonempty();
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should return false for optional non-empty string', () => {
    const schema = z.string().nonempty().optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should handle enum types', () => {
    const schema = z.enum(['a', 'b', 'c']);
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should return false for optional enum', () => {
    const schema = z.enum(['a', 'b', 'c']).optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });

  it('should handle literal types', () => {
    const schema = z.literal('test');
    expect(checkIfFieldIsRequired(schema)).toBe(true);
  });

  it('should return false for optional literal', () => {
    const schema = z.literal('test').optional();
    expect(checkIfFieldIsRequired(schema)).toBe(false);
  });
});
