import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { extractDefault, getSchemaDefaults } from '../defaults';

describe('extractDefault', () => {
  it('should extract default value from ZodDefault', () => {
    const schema = z.string().default('test');
    expect(extractDefault(schema)).toBe('test');
  });

  it('should extract default value from nested optional', () => {
    const schema = z.string().default('test').optional();
    expect(extractDefault(schema)).toBe('test');
  });

  it('should extract default value from nested nullable', () => {
    const schema = z.string().default('test').nullable();
    expect(extractDefault(schema)).toBe('test');
  });

  it('should extract default value from deeply nested wrappers', () => {
    const schema = z.string().default('test').optional().nullable();
    expect(extractDefault(schema)).toBe('test');
  });

  it('should call default function if it is a function', () => {
    const schema = z.string().default(() => 'dynamic');
    expect(extractDefault(schema)).toBe('dynamic');
  });

  it('should return undefined if no default exists', () => {
    const schema = z.string();
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should return undefined for optional without default', () => {
    const schema = z.string().optional();
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should extract object defaults', () => {
    const schema = z.object({ foo: z.string() }).default({ foo: 'bar' });
    expect(extractDefault(schema)).toEqual({ foo: 'bar' });
  });

  it('should extract array defaults', () => {
    const schema = z.array(z.string()).default(['a', 'b']);
    expect(extractDefault(schema)).toEqual(['a', 'b']);
  });

  it('should extract number defaults', () => {
    const schema = z.number().default(42);
    expect(extractDefault(schema)).toBe(42);
  });

  it('should extract boolean defaults', () => {
    const schema = z.boolean().default(true);
    expect(extractDefault(schema)).toBe(true);
  });

  it('should extract default from union with default in first option', () => {
    const schema = z.union([z.string().default('hello'), z.number()]);
    expect(extractDefault(schema)).toBe('hello');
  });

  it('should return undefined for union with default in second option', () => {
    const schema = z.union([z.string(), z.number().default(42)]);
    // extractDefault uses unwrapUnion which returns first field, so default in second option is ignored
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should extract default from union wrapped in optional', () => {
    const schema = z.union([z.string().default('test'), z.number()]).optional();
    expect(extractDefault(schema)).toBe('test');
  });

  it('should extract default from union wrapped in nullable', () => {
    const schema = z.union([z.string().default('test'), z.number()]).nullable();
    expect(extractDefault(schema)).toBe('test');
  });

  it('should return undefined for union with no defaults', () => {
    const schema = z.union([z.string(), z.number()]);
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should extract default from nested union', () => {
    const schema = z.union([
      z.union([z.string().default('nested'), z.number()]),
      z.boolean(),
    ]);
    expect(extractDefault(schema)).toBe('nested');
  });

  it('should extract default from union with object type', () => {
    const schema = z.union([
      z.object({ id: z.string() }).default({ id: 'default' }),
      z.string(),
    ]);
    expect(extractDefault(schema)).toEqual({ id: 'default' });
  });
});

describe('getSchemaDefaults', () => {
  it('should extract flat object defaults', () => {
    const schema = z.object({
      name: z.string().default('John'),
      age: z.number().default(25),
      active: z.boolean().default(true),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
      age: 25,
      active: true,
    });
  });

  it('should skip fields without defaults', () => {
    const schema = z.object({
      name: z.string().default('John'),
      age: z.number(), // no default
      email: z.string(), // no default
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
    });
  });

  it('should skip nested objects without any defaults', () => {
    const schema = z.object({
      name: z.string().default('John'),
      settings: z.object({
        theme: z.string(), // no default
        notifications: z.boolean(), // no default
      }),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
    });
  });

  it('should handle optional fields with defaults', () => {
    const schema = z.object({
      name: z.string().default('John').optional(),
      age: z.number().optional(),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
    });
  });

  it('should handle nullable fields with defaults', () => {
    const schema = z.object({
      name: z.string().default('John').nullable(),
      age: z.number().nullable(),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
    });
  });

  it('should return empty object if no defaults exist', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    expect(getSchemaDefaults(schema)).toEqual({});
  });

  it('should handle array defaults', () => {
    const schema = z.object({
      tags: z.array(z.string()).default(['default']),
      name: z.string(),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      tags: ['default'],
    });
  });

  it('should handle array of objects with nested defaults', () => {
    const schema = z.object({
      items: z
        .array(
          z.object({
            id: z.string(),
            label: z.string().default('Untitled'),
          }),
        )
        .default([]),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      items: [],
    });
  });

  it('should handle function defaults', () => {
    const schema = z.object({
      timestamp: z.number().default(() => Date.now()),
      id: z.string().default(() => 'generated-id'),
    });

    const result = getSchemaDefaults(schema);
    expect(typeof result.timestamp).toBe('number');
    expect(result.id).toBe('generated-id');
  });

  it('should handle mixed types with defaults', () => {
    const schema = z.object({
      string: z.string().default('text'),
      number: z.number().default(42),
      boolean: z.boolean().default(false),
      array: z.array(z.string()).default([]),
      object: z
        .object({
          nested: z.string().default('value'),
        })
        .default({ nested: 'value' }),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      string: 'text',
      number: 42,
      boolean: false,
      array: [],
      object: {
        nested: 'value',
      },
    });
  });
});
