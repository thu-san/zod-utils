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

  it('should return undefined for union with multiple non-nullish types', () => {
    const schema = z.union([z.string().default('hello'), z.number()]);
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should return undefined for union with default in second option', () => {
    const schema = z.union([z.string(), z.number().default(42)]);
    // extractDefault uses unwrapUnion which returns first field, so default in second option is ignored
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should return undefined for union with multiple types wrapped in optional', () => {
    const schema = z.union([z.string().default('test'), z.number()]).optional();
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should return undefined for union with multiple types wrapped in nullable', () => {
    const schema = z.union([z.string().default('test'), z.number()]).nullable();
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should return undefined for union with no defaults', () => {
    const schema = z.union([z.string(), z.number()]);
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should extract default from union with nullish types', () => {
    const schema = z.union([z.string().default('hello'), z.null()]);
    expect(extractDefault(schema)).toBe('hello');
  });

  it('should return undefined for nested union with multiple types', () => {
    const schema = z.union([
      z.union([z.string().default('nested'), z.number()]),
      z.boolean(),
    ]);
    expect(extractDefault(schema)).toBeUndefined();
  });

  it('should return undefined for union with multiple types including object', () => {
    const schema = z.union([
      z.object({ id: z.string() }).default({ id: 'default' }),
      z.string(),
    ]);
    expect(extractDefault(schema)).toBeUndefined();
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
      age: z.number(), // no explicit default - NOT included
      email: z.string(), // no explicit default - NOT included
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
      // age and email are NOT included (no explicit defaults)
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

  it('should include optional fields with defaults', () => {
    const schema = z.object({
      name: z.string().default('John').optional(), // optional with default - included
      age: z.number().optional(), // optional without default - NOT included
      email: z.string().optional(), // optional without default - NOT included
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
      // age and email are NOT included (no explicit defaults)
    });
  });

  it('should include nullable fields with defaults', () => {
    const schema = z.object({
      name: z.string().default('John').nullable(), // nullable with default - included
      age: z.number().nullable(), // nullable without default - NOT included
      bio: z.string().nullable(), // nullable without default - NOT included
    });

    expect(getSchemaDefaults(schema)).toEqual({
      name: 'John',
      // age and bio are NOT included (no explicit defaults)
    });
  });

  it('should skip string and number fields without explicit defaults', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      // name and age are NOT included (no explicit defaults)
    });
  });

  it('should handle array defaults', () => {
    const schema = z.object({
      tags: z.array(z.string()).default(['default']),
      name: z.string(),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      tags: ['default'],
      // name is NOT included (no explicit default)
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

  it('should skip fields without explicit defaults in complex schemas', () => {
    const schema = z.object({
      // Strings without defaults - should be skipped
      firstName: z.string(),
      lastName: z.string().optional(),
      middleName: z.string().nullable(),

      // Numbers without defaults - should be skipped
      age: z.number(),
      weight: z.number().optional(),
      height: z.number().nullable(),

      // Strings with explicit defaults
      title: z.string().default('Mr.'), // required with default - included
      greeting: z.string().default('Hello').optional(), // optional with default - included

      // Numbers with explicit defaults
      count: z.number().default(0), // required with default - included
      quantity: z.number().default(1).optional(), // optional with default - included

      // Other types without defaults - should be skipped
      active: z.boolean(),
      tags: z.array(z.string()),

      // Other types with defaults
      enabled: z.boolean().default(true), // required with default - included
    });

    expect(getSchemaDefaults(schema)).toEqual({
      title: 'Mr.',
      greeting: 'Hello',
      count: 0,
      quantity: 1,
      enabled: true,
      // All fields with explicit defaults are included
    });
  });

  describe('discriminated unions', () => {
    const userSchema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        name: z.string(),
        age: z.number().optional().default(18),
      }),
      z.object({
        mode: z.literal('edit'),
        id: z.number().default(1),
        name: z.string().optional(),
        bio: z.string().optional().default('bio goes here'),
      }),
    ]);

    it('should extract defaults for create mode', () => {
      const result = getSchemaDefaults(userSchema, {
        discriminator: {
          field: 'mode',
          value: 'create',
        },
      });

      expect(result).toEqual({
        age: 18,
      });
    });

    it('should extract defaults for edit mode', () => {
      const result = getSchemaDefaults(userSchema, {
        discriminator: {
          field: 'mode',
          value: 'edit',
        },
      });

      expect(result).toEqual({
        id: 1,
        bio: 'bio goes here',
      });
    });

    it('should return empty object when discriminator option has no defaults', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('a'),
          value: z.string(),
        }),
        z.object({
          type: z.literal('b'),
          count: z.number(),
        }),
      ]);

      const result = getSchemaDefaults(schema, {
        discriminator: {
          field: 'type',
          value: 'a',
        },
      });

      expect(result).toEqual({});
    });

    it('should return empty object without discriminator option', () => {
      const result = getSchemaDefaults(userSchema);

      expect(result).toEqual({});
    });

    it('should return empty object for invalid discriminator value', () => {
      const result = getSchemaDefaults(userSchema, {
        discriminator: {
          field: 'mode',
          // @ts-expect-error - testing invalid value
          value: 'invalid',
        },
      });

      expect(result).toEqual({});
    });

    it('should work with complex discriminated union', () => {
      const paymentSchema = z.discriminatedUnion('method', [
        z.object({
          method: z.literal('card'),
          cardNumber: z.string(),
          cvv: z.string(),
          saveCard: z.boolean().default(false),
        }),
        z.object({
          method: z.literal('paypal'),
          email: z.string().default('user@example.com'),
        }),
        z.object({
          method: z.literal('bank'),
          accountNumber: z.string(),
          routingNumber: z.string(),
        }),
      ]);

      const cardDefaults = getSchemaDefaults(paymentSchema, {
        discriminator: {
          field: 'method',
          value: 'card',
        },
      });

      const paypalDefaults = getSchemaDefaults(paymentSchema, {
        discriminator: {
          field: 'method',
          value: 'paypal',
        },
      });

      const bankDefaults = getSchemaDefaults(paymentSchema, {
        discriminator: {
          field: 'method',
          value: 'bank',
        },
      });

      expect(cardDefaults).toEqual({ saveCard: false });
      expect(paypalDefaults).toEqual({ email: 'user@example.com' });
      expect(bankDefaults).toEqual({});
    });

    it('should work with nested defaults in discriminated union', () => {
      const formSchema = z.discriminatedUnion('status', [
        z.object({
          status: z.literal('active'),
          settings: z
            .object({
              theme: z.string().default('light'),
              notifications: z.boolean().default(true),
            })
            .default({ theme: 'light', notifications: true }),
        }),
        z.object({
          status: z.literal('inactive'),
          reason: z.string().optional(),
        }),
      ]);

      const activeDefaults = getSchemaDefaults(formSchema, {
        discriminator: {
          field: 'status',
          value: 'active',
        },
      });

      expect(activeDefaults).toEqual({
        settings: { theme: 'light', notifications: true },
      });
    });

    it('should work with boolean discriminator values', () => {
      const responseSchema = z.discriminatedUnion('success', [
        z.object({
          success: z.literal(true),
          data: z.string().default('default data'),
        }),
        z.object({
          success: z.literal(false),
          error: z.string().default('Unknown error'),
        }),
      ]);

      const successDefaults = getSchemaDefaults(responseSchema, {
        discriminator: {
          field: 'success',
          value: true,
        },
      });

      const errorDefaults = getSchemaDefaults(responseSchema, {
        discriminator: {
          field: 'success',
          value: false,
        },
      });

      expect(successDefaults).toEqual({ data: 'default data' });
      expect(errorDefaults).toEqual({ error: 'Unknown error' });
    });

    it('should work with numeric discriminator values', () => {
      const statusSchema = z.discriminatedUnion('code', [
        z.object({
          code: z.literal(200),
          message: z.string().default('Success'),
        }),
        z.object({
          code: z.literal(404),
          error: z.string().default('Not found'),
        }),
      ]);

      const successDefaults = getSchemaDefaults(statusSchema, {
        discriminator: {
          field: 'code',
          value: 200,
        },
      });

      expect(successDefaults).toEqual({ message: 'Success' });
    });

    it('should handle schema with undefined field in shape', () => {
      const schema = z.object({
        name: z.string().default('test'),
        age: z.number().default(18),
      });

      // Manually create a corrupted shape for edge case testing
      // @ts-expect-error - intentionally testing edge case
      schema.shape.missing = undefined;

      const result = getSchemaDefaults(schema);
      expect(result).toEqual({ name: 'test', age: 18 });
    });
  });
});
