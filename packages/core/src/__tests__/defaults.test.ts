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

  it('should handle fields without explicit defaults', () => {
    const schema = z.object({
      name: z.string().default('John'),
      age: z.number(), // no default - skipped (not a string)
      email: z.string(), // no explicit default - gets empty string
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
      email: '', // empty string for string without explicit default
    });
  });

  it('should skip nested objects without any defaults', () => {
    const schema = z.object({
      name: z.string().default('John'),
      settings: z.object({
        theme: z.string(), // no default
        notifications: z.boolean(), // no default
      }), // parent object has no default, so entire object is skipped
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
      // settings is skipped because parent object has no .default()
    });
  });

  it('should handle optional fields with defaults', () => {
    const schema = z.object({
      name: z.string().default('John').optional(),
      age: z.number().optional(),
      email: z.string().optional(), // optional string - gets empty string
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
      email: '', // empty string for optional string without explicit default
    });
  });

  it('should handle nullable fields with defaults', () => {
    const schema = z.object({
      name: z.string().default('John').nullable(),
      age: z.number().nullable(),
      bio: z.string().nullable(), // nullable string - gets empty string
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
      bio: '', // empty string for nullable string without explicit default
    });
  });

  it('should return empty strings for string fields even without explicit defaults', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: '', // empty string for string without explicit default
    });
  });

  it('should handle array defaults', () => {
    const schema = z.object({
      tags: z.array(z.string()).default(['default']),
      name: z.string(),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      tags: ['default'],
      name: '', // empty string for string without explicit default
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

  describe('emptyStringDefaults option', () => {
    it('should return empty string for string fields without defaults (default behavior)', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().optional(),
        title: z.string().default('Mr.'),
      });

      expect(getSchemaDefaults(schema)).toEqual({
        name: '',
        email: '',
        title: 'Mr.',
      });
    });

    it('should skip string fields when emptyStringDefaults is false', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().optional(),
        title: z.string().default('Mr.'),
      });

      expect(getSchemaDefaults(schema, { emptyStringDefaults: false })).toEqual(
        {
          title: 'Mr.',
        },
      );
    });

    it('should return empty string for nullable strings', () => {
      const schema = z.object({
        name: z.string().nullable(),
        bio: z.string(),
      });

      expect(getSchemaDefaults(schema)).toEqual({
        name: '',
        bio: '',
      });
    });

    it('should prefer explicit default over empty string', () => {
      const schema = z.object({
        withDefault: z.string().default('hello'),
        withoutDefault: z.string(),
      });

      expect(getSchemaDefaults(schema)).toEqual({
        withDefault: 'hello',
        withoutDefault: '',
      });
    });

    it('should return empty string for string unions', () => {
      const schema = z.object({
        status: z.union([z.literal('active'), z.literal('inactive')]),
        name: z.string(),
      });

      expect(getSchemaDefaults(schema)).toEqual({
        name: '',
      });
    });

    it('should handle complex schema with mixed string defaults', () => {
      const schema = z.object({
        // Strings without defaults - should get ""
        firstName: z.string(),
        lastName: z.string().optional(),
        middleName: z.string().nullable(),

        // Strings with explicit defaults - should use those
        title: z.string().default('Mr.'),
        greeting: z.string().default('Hello').optional(),

        // Other types without defaults - should be skipped
        age: z.number(),
        active: z.boolean(),
        tags: z.array(z.string()),

        // Other types with defaults - should use those
        count: z.number().default(0),
        enabled: z.boolean().default(true),
      });

      expect(getSchemaDefaults(schema)).toEqual({
        firstName: '',
        lastName: '',
        middleName: '',
        title: 'Mr.',
        greeting: 'Hello',
        count: 0,
        enabled: true,
      });
    });

    it('should disable empty strings for all string fields when option is false', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().optional(),
        bio: z.string().nullable(),
        title: z.string().default('Dr.'),
      });

      expect(getSchemaDefaults(schema, { emptyStringDefaults: false })).toEqual(
        {
          title: 'Dr.',
        },
      );
    });
  });
});
