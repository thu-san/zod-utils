import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { flattenFieldSelector, toFormFieldSelector } from '../utils';

describe('toFormFieldSelector', () => {
  describe('with regular schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should extract selector props from a props object', () => {
      const result = toFormFieldSelector({
        schema,
        name: 'name' as const,
      });

      expect(result).toEqual({
        schema,
        name: 'name',
      });
    });

    it('should include discriminator when provided', () => {
      const discriminatedSchema = z.discriminatedUnion('mode', [
        z.object({ mode: z.literal('create'), title: z.string() }),
        z.object({ mode: z.literal('edit'), id: z.number() }),
      ]);

      const result = toFormFieldSelector({
        schema: discriminatedSchema,
        name: 'title' as const,
        discriminator: { key: 'mode' as const, value: 'create' as const },
      });

      expect(result).toEqual({
        schema: discriminatedSchema,
        name: 'title',
        discriminator: { key: 'mode', value: 'create' },
      });
    });
  });
});

describe('flattenFieldSelector', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
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

  it('should handle empty params', () => {
    const result = flattenFieldSelector({});

    expect(result).toEqual([]);
  });
});
