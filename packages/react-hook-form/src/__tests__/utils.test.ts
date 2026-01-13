import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { flattenFieldSelector } from '../utils';

describe('flattenFieldSelector', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it('should return empty array for undefined params', () => {
    const result = flattenFieldSelector(undefined);

    expect(result).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('should flatten selector without discriminator', () => {
    const result = flattenFieldSelector({
      schema,
      name: 'name' as const,
    });

    expect(result).toContain(schema);
    expect(result).toContain('name');
  });

  it('should flatten selector with discriminator', () => {
    const discriminatedSchema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), title: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    const result = flattenFieldSelector({
      schema: discriminatedSchema,
      name: 'title' as const,
      discriminator: { key: 'mode' as const, value: 'create' as const },
    });

    expect(result).toContain(discriminatedSchema);
    expect(result).toContain('title');
    expect(result).toContain('mode');
    expect(result).toContain('create');
  });

  describe('schemas with transforms', () => {
    it('should flatten selector with normal schema with transform', () => {
      const schemaWithTransform = z
        .object({
          name: z.string(),
          age: z.number(),
        })
        .transform((data) => ({
          ...data,
          displayName: data.name.toUpperCase(),
        }));

      const result = flattenFieldSelector({
        schema: schemaWithTransform,
        name: 'name' as const,
      });

      expect(result).toContain(schemaWithTransform);
      expect(result).toContain('name');
    });

    it('should flatten selector with optional fields and transform', () => {
      const schemaWithTransform = z
        .object({
          title: z.string(),
          description: z.string().optional(),
        })
        .transform((data) => ({
          ...data,
          hasDescription: !!data.description,
        }));

      const result = flattenFieldSelector({
        schema: schemaWithTransform,
        name: 'description' as const,
      });

      expect(result).toContain(schemaWithTransform);
      expect(result).toContain('description');
    });
  });

  describe('discriminated union schemas with transforms', () => {
    it('should flatten selector with discriminated union with transform', () => {
      const discriminatedSchemaWithTransform = z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('create'), name: z.string() }),
          z.object({ type: z.literal('edit'), id: z.number() }),
        ])
        .transform((data) => ({ ...data, processed: true }));

      const result = flattenFieldSelector({
        schema: discriminatedSchemaWithTransform,
        name: 'name' as const,
        discriminator: { key: 'type' as const, value: 'create' as const },
      });

      expect(result).toContain(discriminatedSchemaWithTransform);
      expect(result).toContain('name');
      expect(result).toContain('type');
      expect(result).toContain('create');
    });

    it('should flatten selector with discriminated union with superRefine', () => {
      const discriminatedSchemaWithRefine = z
        .discriminatedUnion('mode', [
          z.object({ mode: z.literal('active'), count: z.number() }),
          z.object({ mode: z.literal('inactive'), reason: z.string() }),
        ])
        .superRefine(() => {});

      const result = flattenFieldSelector({
        schema: discriminatedSchemaWithRefine,
        name: 'count' as const,
        discriminator: { key: 'mode' as const, value: 'active' as const },
      });

      expect(result).toContain(discriminatedSchemaWithRefine);
      expect(result).toContain('count');
      expect(result).toContain('mode');
      expect(result).toContain('active');
    });

    it('should flatten selector with discriminated union with superRefine and transform', () => {
      const complexSchema = z
        .discriminatedUnion('action', [
          z.object({ action: z.literal('submit'), payload: z.string() }),
          z.object({
            action: z.literal('cancel'),
            reason: z.string().optional(),
          }),
        ])
        .superRefine(() => {})
        .transform((data) => ({ ...data, timestamp: Date.now() }));

      const result = flattenFieldSelector({
        schema: complexSchema,
        name: 'payload' as const,
        discriminator: { key: 'action' as const, value: 'submit' as const },
      });

      expect(result).toContain(complexSchema);
      expect(result).toContain('payload');
      expect(result).toContain('action');
      expect(result).toContain('submit');
    });
  });
});
