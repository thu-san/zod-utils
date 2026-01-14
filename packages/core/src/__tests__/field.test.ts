import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { extendWithMeta, extractFieldFromSchema } from '../field';

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

    it('should extract field from object schema with superRefine', () => {
      const schema = z
        .object({
          name: z.string(),
          age: z.number(),
        })
        .superRefine(() => {});

      const result = extractFieldFromSchema({
        schema,
        name: 'name',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });

    it('should extract field from object schema with multiple transforms', () => {
      const schema = z
        .object({
          name: z.string(),
          age: z.number(),
        })
        .transform((data) => ({ ...data, step1: true }))
        .transform((data) => ({ ...data, step2: true }));

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

    it('should extract field from discriminated union with superRefine', () => {
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
        .superRefine(() => {});

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

    it('should extract field from discriminated union with superRefine and transform', () => {
      const schema = z
        .discriminatedUnion('action', [
          z.object({
            action: z.literal('submit'),
            payload: z.string(),
          }),
          z.object({
            action: z.literal('cancel'),
            reason: z.string().optional(),
          }),
        ])
        .superRefine(() => {})
        .transform((data) => ({ ...data, timestamp: Date.now() }));

      const result = extractFieldFromSchema({
        schema,
        name: 'payload',
        discriminator: {
          key: 'action',
          value: 'submit',
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

  describe('nullable schemas', () => {
    it('should extract field from object with nullable field', () => {
      const schema = z.object({
        name: z.string().nullable(),
        age: z.number(),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'name',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodNullable);
    });

    it('should extract nested field through nullable object', () => {
      const schema = z.object({
        profile: z
          .object({
            bio: z.string(),
          })
          .nullable(),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'profile.bio',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodString);
    });
  });

  describe('union type fields', () => {
    it('should extract union field from object schema', () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()]),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'value',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodUnion);
    });

    it('should extract union with null from object schema', () => {
      const schema = z.object({
        name: z.union([z.string(), z.null()]),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'name',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodUnion);
    });

    it('should extract union field from discriminated union schema', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('a'),
          value: z.union([z.string(), z.number()]),
        }),
        z.object({
          type: z.literal('b'),
          count: z.number(),
        }),
      ]);

      const result = extractFieldFromSchema({
        schema,
        name: 'value',
        discriminator: {
          key: 'type',
          value: 'a',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodUnion);
    });

    it('should allow accessing .options on extracted ZodUnion', () => {
      const schema = z.object({
        a: z.union([z.string(), z.null()]),
        b: z.number(),
        c: z.boolean(),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'a',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodUnion);
      // Verify .options is accessible on the extracted union type
      expect(result.options).toBeDefined();
      expect(result.options.length).toBe(2);
      expect(result.options[0]).toBeInstanceOf(z.ZodString);
      expect(result.options[1]).toBeInstanceOf(z.ZodNull);
    });
  });

  describe('fields with transforms (ZodPipe)', () => {
    it('should extract field that has transform and access .in.shape', () => {
      const schema = z.object({
        detail: z
          .object({
            location: z.string().max(200).nullable().optional(),
            name: z.string().max(100).nullable().optional(),
          })
          .transform((detail) => ({
            location: detail.location || null,
            name: detail.name || null,
          })),
      });

      const result = extractFieldFromSchema({
        schema,
        name: 'detail',
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodPipe);
      // Users can access the input schema via .in to inspect shape/constraints
      expect(result.in).toBeInstanceOf(z.ZodObject);
      expect(result.in.shape.location).toBeDefined();
      expect(result.in.shape.name).toBeDefined();
    });

    it('should extract nested field through transform using dot notation', () => {
      const schema = z.object({
        detail: z
          .object({
            location: z.string().max(200).nullable().optional(),
            name: z.string().max(100).nullable().optional(),
          })
          .transform((detail) => ({
            location: detail.location || null,
            name: detail.name || null,
          })),
      });

      // This tests that extractFieldFromSchema can navigate through transforms
      const result = extractFieldFromSchema({
        schema,
        name: 'detail.location',
      });

      expect(result).toBeDefined();
      // The field inside the transform input is ZodOptional<ZodNullable<ZodString>>
      expect(result).toBeInstanceOf(z.ZodOptional);
    });

    it('should extract from discriminated union with transform and nested path', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('other'),
            detail: z
              .object({
                entry_name: z.string().max(100).nullable().optional(),
                location: z.string().max(200).nullable().optional(),
              })
              .transform((detail) => ({
                name: detail.entry_name || null,
                location: detail.location || null,
              })),
          }),
          z.object({
            type: z.literal('hotel'),
            detail: z.object({}),
          }),
        ])
        .superRefine(() => {})
        .transform((data) => ({ ...data }));

      const result = extractFieldFromSchema({
        schema,
        name: 'detail.location',
        discriminator: {
          key: 'type',
          value: 'other',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodOptional);
    });

    it('should access .in.shape on extracted field from discriminated union', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('other'),
            detail: z
              .object({
                entry_name: z.string().max(100).nullable().optional(),
                location: z.string().max(200).nullable().optional(),
              })
              .transform((detail) => ({
                name: detail.entry_name || null,
                location: detail.location || null,
              })),
          }),
          z.object({
            type: z.literal('hotel'),
            detail: z.object({}),
          }),
        ])
        .superRefine(() => {})
        .transform((data) => ({ ...data }));

      const result = extractFieldFromSchema({
        schema,
        name: 'detail',
        discriminator: {
          key: 'type',
          value: 'other',
        },
      });

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(z.ZodPipe);
      // Navigate through ZodPipe to access input schema shape
      expect(result.in).toBeInstanceOf(z.ZodObject);
      expect(result.in.shape.location).toBeDefined();
      expect(result.in.shape.entry_name).toBeDefined();
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
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: 'anyField' as never, // Invalid path on non-object schema
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
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: 'count.something' as never, // Path through non-navigable type
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
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: 'user.nonexistent.field' as never, // Invalid nested path
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

  it('should work with field that has transform', () => {
    const baseField = z
      .string()
      .transform((val) => val.toUpperCase())
      .meta({ translationKey: 'user.field.code' });

    // Note: We can't chain .min() after transform, but we can use refine
    const extendedField = extendWithMeta(baseField, (f) =>
      f.refine((val) => val.length >= 3, { message: 'Too short' }),
    );

    expect(extendedField.meta()).toEqual({ translationKey: 'user.field.code' });
    expect(extendedField.safeParse('ab').success).toBe(false);
    expect(extendedField.safeParse('abc').success).toBe(true);
  });
});
