import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { flattenFieldSelector } from '../utils';

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
});
