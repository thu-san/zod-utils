import { bench, describe } from 'vitest';
import { z } from 'zod';
import { extractDefault, getSchemaDefaults } from '../src/defaults';

describe('Default Extraction Benchmarks', () => {
  // Simple schema
  const simpleSchema = z.object({
    name: z.string().default('John'),
    age: z.number().default(25),
    isActive: z.boolean().default(true),
  });

  // Complex nested schema
  const complexSchema = z.object({
    user: z
      .object({
        profile: z
          .object({
            firstName: z.string().default('John'),
            lastName: z.string().default('Doe'),
            email: z.string().email().default('john@example.com'),
          })
          .default({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          }),
        settings: z
          .object({
            theme: z.enum(['light', 'dark']).default('light'),
            notifications: z.boolean().default(true),
            language: z.string().default('en'),
          })
          .default({ theme: 'light', notifications: true, language: 'en' }),
      })
      .default({
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        settings: { theme: 'light', notifications: true, language: 'en' },
      }),
    metadata: z
      .object({
        createdAt: z.date().default(new Date()),
        updatedAt: z.date().default(new Date()),
        tags: z.array(z.string()).default([]),
      })
      .default({ createdAt: new Date(), updatedAt: new Date(), tags: [] }),
  });

  // Large schema with many fields
  const largeSchema = z.object(
    Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [
        `field${i}`,
        z.string().default(`value${i}`),
      ]),
    ),
  );

  bench('getSchemaDefaults - simple schema (3 fields)', () => {
    getSchemaDefaults(simpleSchema);
  });

  bench('getSchemaDefaults - complex nested schema', () => {
    getSchemaDefaults(complexSchema);
  });

  bench('getSchemaDefaults - large schema (100 fields)', () => {
    getSchemaDefaults(largeSchema);
  });

  bench('extractDefault - string with default', () => {
    const schema = z.string().default('test');
    extractDefault(schema);
  });

  bench('extractDefault - string without default', () => {
    const schema = z.string();
    extractDefault(schema);
  });

  bench('extractDefault - complex type with default', () => {
    const schema = z
      .object({
        nested: z.string().default('value'),
      })
      .default({ nested: 'value' });
    extractDefault(schema);
  });
});
