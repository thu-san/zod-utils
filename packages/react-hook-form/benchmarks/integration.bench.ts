import { zodResolver } from '@hookform/resolvers/zod';
import { getSchemaDefaults } from '@zod-utils/core';
import { bench, describe } from 'vitest';
import { z } from 'zod';

describe('Integration Benchmarks', () => {
  // Test schema setup + default extraction workflow
  const userFormSchema = z.object({
    username: z.string().default(''),
    email: z.string().email().default(''),
    firstName: z.string().default(''),
    lastName: z.string().default(''),
    age: z.number().default(0),
    bio: z.string().default(''),
    notifications: z.boolean().default(true),
    theme: z.enum(['light', 'dark']).default('light'),
  });

  const profileFormSchema = z.object({
    personal: z
      .object({
        name: z.string().default(''),
        email: z.string().email().default(''),
        phone: z.string().default(''),
        avatar: z.string().url().default('https://example.com/avatar.png'),
      })
      .default({
        name: '',
        email: '',
        phone: '',
        avatar: 'https://example.com/avatar.png',
      }),
    preferences: z
      .object({
        language: z.string().default('en'),
        timezone: z.string().default('UTC'),
        notifications: z.boolean().default(true),
        newsletter: z.boolean().default(false),
      })
      .default({
        language: 'en',
        timezone: 'UTC',
        notifications: true,
        newsletter: false,
      }),
    social: z
      .object({
        twitter: z.string().default(''),
        github: z.string().default(''),
        linkedin: z.string().default(''),
        website: z.string().url().optional(),
      })
      .default({ twitter: '', github: '', linkedin: '' }),
  });

  bench('form setup - simple form (8 fields)', () => {
    getSchemaDefaults(userFormSchema);
    zodResolver(userFormSchema);
  });

  bench('form setup - complex nested form', () => {
    getSchemaDefaults(profileFormSchema);
    zodResolver(profileFormSchema);
  });

  // Test complete form lifecycle simulation
  const simpleFormResolver = zodResolver(userFormSchema);
  const formData = {
    username: 'johndoe',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    bio: 'Software developer',
    notifications: true,
    theme: 'dark' as const,
  };

  bench('complete validation cycle - simple form', async () => {
    await simpleFormResolver(
      formData,
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  // Test with optional and nullable fields
  const optionalFieldsSchema = z.object({
    required: z.string().min(1),
    optional: z.string().optional(),
    nullable: z.string().nullable(),
    optionalNullable: z.string().nullable().optional(),
    withDefault: z.string().default('default'),
  });

  const optionalResolver = zodResolver(optionalFieldsSchema);

  bench('validation - schema with optional/nullable fields', async () => {
    await optionalResolver(
      {
        required: 'value',
        optional: undefined,
        nullable: null,
        optionalNullable: null,
      },
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  // Test array and object validations
  const arrayFormSchema = z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        quantity: z.number().min(1),
        price: z.number().min(0),
      }),
    ),
    tags: z.array(z.string()),
    metadata: z.record(z.string(), z.string()),
  });

  const arrayResolver = zodResolver(arrayFormSchema);
  const arrayData = {
    items: [
      { id: '1', name: 'Item 1', quantity: 5, price: 29.99 },
      { id: '2', name: 'Item 2', quantity: 3, price: 49.99 },
      { id: '3', name: 'Item 3', quantity: 1, price: 99.99 },
    ],
    tags: ['tag1', 'tag2', 'tag3'],
    metadata: { key1: 'value1', key2: 'value2' },
  };

  bench('validation - array and object fields', async () => {
    await arrayResolver(
      arrayData,
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  // Test refinements and transforms
  const refinedSchema = z
    .object({
      password: z.string().min(8),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    });

  const refinedResolver = zodResolver(refinedSchema);

  bench('validation - schema with refinements (valid)', async () => {
    await refinedResolver(
      { password: 'password123', confirmPassword: 'password123' },
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  bench('validation - schema with refinements (invalid)', async () => {
    await refinedResolver(
      { password: 'password123', confirmPassword: 'different' },
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });

  // Test async validation
  const asyncSchema = z.object({
    username: z.string().refine(
      async (val) => {
        // Simulate async validation (e.g., checking username availability)
        await new Promise((resolve) => setTimeout(resolve, 1));
        return val.length >= 3;
      },
      { message: 'Username must be at least 3 characters' },
    ),
    email: z.string().email(),
  });

  const asyncResolver = zodResolver(asyncSchema);

  bench('validation - async schema validation', async () => {
    await asyncResolver(
      { username: 'johndoe', email: 'john@example.com' },
      {},
      { criteriaMode: 'all', fields: {}, shouldUseNativeValidation: undefined },
    );
  });
});
