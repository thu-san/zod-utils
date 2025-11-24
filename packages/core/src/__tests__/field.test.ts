import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { extractFieldFromSchema } from '../field';

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
        fieldName: 'name',
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
        fieldName: 'age',
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
        fieldName: 'bio',
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
        fieldName: 'age',
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
        fieldName: 'name',
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
        fieldName: 'id',
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
        fieldName: 'age',
        discriminator: {
          key: 'mode',
          value: 'create',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodOptional);
    });

    it('should return undefined when discriminator is not provided', () => {
      const result = extractFieldFromSchema({
        schema: userSchema,
        fieldName: 'name',
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
        fieldName: 'cardNumber',
        discriminator: {
          key: 'method',
          value: 'card',
        },
      });

      expect(cardNumberResult).toBeDefined();
      expect(cardNumberResult).toBeInstanceOf(z.ZodString);

      const emailResult = extractFieldFromSchema({
        schema: paymentSchema,
        fieldName: 'email',
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
        fieldName: 'data',
        discriminator: {
          key: 'success',
          value: true,
        },
      });

      expect(dataResult).toBeDefined();
      expect(dataResult).toBeInstanceOf(z.ZodString);

      const errorResult = extractFieldFromSchema({
        schema: responseSchema,
        fieldName: 'error',
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
        fieldName: 'message',
        discriminator: {
          key: 'code',
          value: 200,
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });
  });

  describe('edge cases', () => {
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
        fieldName: 'type',
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
        fieldName: 'settings',
      });

      expect(settingsResult).toBeDefined();
      expect(settingsResult).toBeInstanceOf(z.ZodObject);

      const tagsResult = extractFieldFromSchema({
        schema,
        fieldName: 'tags',
      });

      expect(tagsResult).toBeDefined();
      expect(tagsResult).toBeInstanceOf(z.ZodArray);
    });
  });
});
