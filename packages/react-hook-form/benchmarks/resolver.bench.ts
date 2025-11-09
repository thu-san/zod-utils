import { zodResolver } from '@hookform/resolvers/zod';
import { bench, describe } from 'vitest';
import { z } from 'zod';

describe('Zod Resolver Benchmarks', () => {
  // Simple schema
  const simpleSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().min(0),
  });

  // Complex nested schema
  const complexSchema = z.object({
    user: z.object({
      profile: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      }),
      settings: z.object({
        theme: z.enum(['light', 'dark']),
        notifications: z.boolean(),
        language: z.string().default('en'),
      }),
    }),
    metadata: z.object({
      createdAt: z.date(),
      updatedAt: z.date(),
      tags: z.array(z.string()),
    }),
  });

  // Large schema with many fields
  const largeSchema = z.object(
    Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [
        `field${i}`,
        i % 3 === 0
          ? z.string().min(1)
          : i % 3 === 1
            ? z.number()
            : z.boolean(),
      ]),
    ),
  );

  // Schema with validation rules
  const validationSchema = z.object({
    username: z
      .string()
      .min(3)
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string(),
    age: z.number().min(18).max(120),
    website: z.string().url().optional(),
    bio: z.string().max(500).optional(),
  });

  bench('zodResolver creation - simple schema', () => {
    zodResolver(simpleSchema);
  });

  bench('zodResolver creation - complex nested schema', () => {
    zodResolver(complexSchema);
  });

  bench('zodResolver creation - large schema (50 fields)', () => {
    zodResolver(largeSchema);
  });

  bench('zodResolver creation - schema with validation rules', () => {
    zodResolver(validationSchema);
  });

  // Benchmark validation performance
  const simpleResolver = zodResolver(simpleSchema);
  const validData = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 25,
  };

  const invalidData = {
    name: '',
    email: 'invalid-email',
    age: -5,
  };

  bench('validation - simple schema (valid data)', async () => {
    await simpleResolver(
      validData,
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  bench('validation - simple schema (invalid data)', async () => {
    await simpleResolver(
      invalidData,
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  // Complex schema validation
  const complexResolver = zodResolver(complexSchema);
  const complexValidData = {
    user: {
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      settings: {
        theme: 'light' as const,
        notifications: true,
        language: 'en',
      },
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['tag1', 'tag2', 'tag3'],
    },
  };

  bench('validation - complex nested schema (valid data)', async () => {
    await complexResolver(
      complexValidData,
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  // Large schema validation
  const largeResolver = zodResolver(largeSchema);
  const largeValidData = Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [
      `field${i}`,
      i % 3 === 0 ? 'value' : i % 3 === 1 ? 42 : true,
    ]),
  );

  bench('validation - large schema (50 fields, valid data)', async () => {
    await largeResolver(
      largeValidData,
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  // Validation with errors
  const validationResolver = zodResolver(validationSchema);
  const dataWithErrors = {
    username: 'ab', // Too short
    email: 'invalid', // Invalid email
    password: '123', // Too short
    confirmPassword: 'different',
    age: 15, // Too young
    website: 'not-a-url',
    bio: 'Valid bio',
  };

  bench('validation - schema with multiple validation errors', async () => {
    await validationResolver(
      dataWithErrors,
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });
});
