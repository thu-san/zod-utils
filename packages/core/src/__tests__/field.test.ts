import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import {
  extendWithMeta,
  extractFieldFromSchema,
  mergeFieldSelectorProps,
} from '../field';

describe('extractFieldFromSchema', () => {
  describe('ZodObject schemas', () => {
    it('should extract field from a simple object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'name',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should extract number field from object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'age',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodNumber);
    });

    it('should extract optional field from object schema', () => {
      const schema = z.object({
        name: z.string(),
        bio: z.string().optional(),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'bio',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodOptional);
    });

    it('should extract field with default from object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().default(18),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'age',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodDefault);
    });
  });

  describe('ZodDiscriminatedUnion schemas', () => {
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

    it('should extract field from discriminated union with discriminator (create mode)', () => {
      const result = extractFieldFromSchema({
        schema: userSchema,
        name: 'name',
        discriminator: {
          key: 'mode',
          value: 'create',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should extract field from discriminated union with discriminator (edit mode)', () => {
      const result = extractFieldFromSchema({
        schema: userSchema,
        name: 'id',
        discriminator: {
          key: 'mode',
          value: 'edit',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodNumber);
    });

    it('should extract optional field from discriminated union', () => {
      const result = extractFieldFromSchema({
        schema: userSchema,
        name: 'age',
        discriminator: {
          key: 'mode',
          value: 'create',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodOptional);
    });

    it('should return undefined when discriminator is not provided', () => {
      // @ts-expect-error - intentionally testing without discriminator
      const result = extractFieldFromSchema({
        schema: userSchema,
        name: 'name',
      });

      expect(result).toBeUndefined();
    });

    it('should handle discriminated union with different field types', () => {
      const paymentSchema = z.discriminatedUnion('method', [
        z.object({
          method: z.literal('card'),
          cardNumber: z.string(),
          cvv: z.string(),
          saveCard: z.boolean().default(false),
        }),
        z.object({
          method: z.literal('paypal'),
          email: z.string().email(),
        }),
      ]);

      const cardNumberResult = extractFieldFromSchema({
        schema: paymentSchema,
        name: 'cardNumber',
        discriminator: {
          key: 'method',
          value: 'card',
        },
      });

      expect(cardNumberResult).toBeDefined();
      expect(cardNumberResult).toBeInstanceOf(z.ZodString);

      const emailResult = extractFieldFromSchema({
        schema: paymentSchema,
        name: 'email',
        discriminator: {
          key: 'method',
          value: 'paypal',
        },
      });

      expect(emailResult).toBeDefined();
      expect(emailResult).toBeInstanceOf(z.ZodString);
    });

    it('should handle discriminated union with boolean discriminator', () => {
      const responseSchema = z.discriminatedUnion('success', [
        z.object({
          success: z.literal(true),
          data: z.string(),
        }),
        z.object({
          success: z.literal(false),
          error: z.string(),
        }),
      ]);

      const dataResult = extractFieldFromSchema({
        schema: responseSchema,
        name: 'data',
        discriminator: {
          key: 'success',
          value: true,
        },
      });

      expect(dataResult).toBeDefined();
      expect(dataResult).toBeInstanceOf(z.ZodString);

      const errorResult = extractFieldFromSchema({
        schema: responseSchema,
        name: 'error',
        discriminator: {
          key: 'success',
          value: false,
        },
      });

      expect(errorResult).toBeDefined();
      expect(errorResult).toBeInstanceOf(z.ZodString);
    });

    it('should handle discriminated union with numeric discriminator', () => {
      const statusSchema = z.discriminatedUnion('code', [
        z.object({
          code: z.literal(200),
          message: z.string(),
        }),
        z.object({
          code: z.literal(404),
          error: z.string(),
        }),
      ]);

      const result = extractFieldFromSchema({
        schema: statusSchema,
        name: 'message',
        discriminator: {
          key: 'code',
          value: 200,
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });
  });

  describe('schemas with transforms', () => {
    it('should extract field from object schema with transform', () => {
      const schema = z
        .object({
          name: z.string(),
          age: z.number(),
        })
        .transform((data) => ({ ...data, computed: true }));

      const result = extractFieldFromSchema({
        schema,
        name: 'name',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should extract field from discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('mode', [
          z.object({
            mode: z.literal('create'),
            name: z.string(),
          }),
          z.object({
            mode: z.literal('edit'),
            id: z.number(),
          }),
        ])
        .transform((data) => ({ ...data, timestamp: Date.now() }));

      const result = extractFieldFromSchema({
        schema,
        name: 'name',
        discriminator: {
          key: 'mode',
          value: 'create',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should extract field from nested transform with optional', () => {
      const schema = z
        .object({
          email: z.string().email(),
          count: z.number().default(0),
        })
        .optional()
        .transform((data) => data ?? { email: '', count: 0 });

      const result = extractFieldFromSchema({
        schema,
        name: 'email',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });
  });

  describe('edge cases', () => {
    it('should return undefined for non-object schema (e.g., ZodString)', () => {
      const schema = z.string();
      const result = extractFieldFromSchema({
        schema,
        name: 'anyField',
      });

      expect(result).toBeUndefined();
    });

    it('should return undefined for ZodArray schema', () => {
      const schema = z.array(z.string());
      const result = extractFieldFromSchema({
        schema,
        // @ts-expect-error - Testing invalid path on non-object schema
        name: 'anyField',
      });

      expect(result).toBeUndefined();
    });

    it('should return undefined for array with non-numeric segment', () => {
      const schema = z.object({
        items: z.array(z.object({ name: z.string() })),
      });
      const result = extractFieldFromSchema({
        schema,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: 'items.notANumber.name' as 'items.0.name',
      });

      expect(result).toBeUndefined();
    });

    it('should return undefined when navigating through unsupported type', () => {
      const schema = z.object({
        count: z.number(),
      });
      const result = extractFieldFromSchema({
        schema,
        // @ts-expect-error - Testing path through non-navigable type
        name: 'count.something',
      });

      expect(result).toBeUndefined();
    });

    it('should handle extracting the discriminator field itself', () => {
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

      const result = extractFieldFromSchema({
        schema,
        name: 'type',
        discriminator: {
          key: 'type',
          value: 'a',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodLiteral);
    });

    it('should handle complex nested field types', () => {
      const schema = z.object({
        name: z.string(),
        settings: z.object({
          theme: z.string(),
          notifications: z.boolean(),
        }),
        tags: z.array(z.string()),
      });

      const settingsResult = extractFieldFromSchema({
        schema,
        name: 'settings',
      });

      expect(settingsResult).toBeDefined();
      expect(settingsResult).toBeInstanceOf(z.ZodObject);

      const tagsResult = extractFieldFromSchema({
        schema,
        name: 'tags',
      });

      expect(tagsResult).toBeDefined();
      expect(tagsResult).toBeInstanceOf(z.ZodArray);
    });
  });

  describe('nested path extraction', () => {
    it('should extract nested field from object schema', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            age: z.number(),
          }),
        }),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'user.profile.name',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should extract field from array element', () => {
      const schema = z.object({
        addresses: z.array(
          z.object({
            street: z.string(),
            city: z.string(),
          }),
        ),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'addresses.0.street',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should skip array index and access element field directly', () => {
      const schema = z.object({
        items: z.array(
          z.object({
            name: z.string(),
            quantity: z.number(),
          }),
        ),
      });

      // With numeric index
      const resultWithIndex = extractFieldFromSchema({
        schema,
        name: 'items.0.name',
      });

      expect(resultWithIndex).toBeDefined();
      expect(resultWithIndex).toBeInstanceOf(z.ZodString);

      // Also works with any index
      const resultWithOtherIndex = extractFieldFromSchema({
        schema,
        name: 'items.99.quantity',
      });

      expect(resultWithOtherIndex).toBeDefined();
      expect(resultWithOtherIndex).toBeInstanceOf(z.ZodNumber);
    });

    it('should handle deeply nested paths with arrays', () => {
      const schema = z.object({
        company: z.object({
          departments: z.array(
            z.object({
              employees: z.array(
                z.object({
                  name: z.string(),
                  email: z.string().email(),
                }),
              ),
            }),
          ),
        }),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'company.departments.0.employees.0.email',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should return undefined for invalid nested path', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
        }),
      });

      const result = extractFieldFromSchema({
        schema,
        // @ts-expect-error - Testing runtime behavior with invalid path
        name: 'user.nonexistent.field',
      });

      expect(result).toBeUndefined();
    });

    it('should handle optional nested objects', () => {
      const schema = z.object({
        profile: z
          .object({
            bio: z.string(),
          })
          .optional(),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'profile.bio',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should handle nested objects with defaults', () => {
      const schema = z.object({
        settings: z
          .object({
            theme: z.string(),
          })
          .default({ theme: 'light' }),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'settings.theme',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });
  });
});

describe('extendWithMeta', () => {
  it('should preserve metadata when extending a field', () => {
    const baseField = z.string().meta({ translationKey: 'user.field.name' });

    const extendedField = extendWithMeta(baseField, (f) => f.min(3).max(100));

    expect(extendedField.meta()).toEqual({ translationKey: 'user.field.name' });
  });

  it('should apply the transformation correctly', () => {
    const baseField = z.string().meta({ translationKey: 'user.field.name' });

    const extendedField = extendWithMeta(baseField, (f) => f.min(3).max(100));

    // Should fail min(3) validation
    expect(extendedField.safeParse('ab').success).toBe(false);
    // Should pass validation
    expect(extendedField.safeParse('abc').success).toBe(true);
    // Should fail max(100) validation
    expect(extendedField.safeParse('a'.repeat(101)).success).toBe(false);
  });

  it('should work when field has no metadata', () => {
    const baseField = z.string();

    const extendedField = extendWithMeta(baseField, (f) => f.min(1));

    expect(extendedField.meta()).toBeUndefined();
    expect(extendedField.safeParse('').success).toBe(false);
    expect(extendedField.safeParse('a').success).toBe(true);
  });

  it('should preserve complex metadata', () => {
    const baseField = z.number().meta({
      translationKey: 'user.field.age',
      description: 'User age',
      validation: { min: 0, max: 150 },
    });

    const extendedField = extendWithMeta(baseField, (f) => f.min(18).max(120));

    expect(extendedField.meta()).toEqual({
      translationKey: 'user.field.age',
      description: 'User age',
      validation: { min: 0, max: 150 },
    });
  });
});

describe('mergeFieldSelectorProps', () => {
  describe('with regular schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should merge factory props with component props', () => {
      const result = mergeFieldSelectorProps(
        { schema },
        { name: 'name' as const },
      );

      expect(result).toEqual({
        schema,
        name: 'name',
      });
    });

    it('should handle undefined discriminator', () => {
      const result = mergeFieldSelectorProps(
        { schema },
        { name: 'age' as const, discriminator: undefined },
      );

      expect(result).toEqual({
        schema,
        name: 'age',
        discriminator: undefined,
      });
    });
  });

  describe('with discriminated union', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), title: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    it('should include discriminator when provided', () => {
      const result = mergeFieldSelectorProps(
        { schema },
        {
          name: 'title' as const,
          discriminator: { key: 'mode' as const, value: 'create' as const },
        },
      );

      expect(result).toEqual({
        schema,
        name: 'title',
        discriminator: { key: 'mode', value: 'create' },
      });
    });
  });
});
