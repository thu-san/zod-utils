import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { useZodForm } from '../use-zod-form';

describe('useZodForm', () => {
  it('should initialize form with schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: { name: '', age: 0 },
      }),
    );

    expect(result.current).toBeDefined();
    expect(result.current.formState).toBeDefined();
    expect(result.current.register).toBeDefined();
    expect(result.current.handleSubmit).toBeDefined();
  });

  it('should initialize with schema and resolver', () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: { email: '', age: 0 },
      }),
    );

    expect(result.current).toBeDefined();
    expect(result.current.formState).toBeDefined();
    // Verify the resolver is set up by checking formState has the right shape
    expect(result.current.formState.isSubmitting).toBe(false);
  });

  it('should provide setValue and getValues', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(18),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: { name: 'John', age: 25 },
      }),
    );

    expect(result.current.setValue).toBeDefined();
    expect(result.current.getValues).toBeDefined();

    // Verify default values
    const values = result.current.getValues();
    expect(values.name).toBe('John');
    expect(values.age).toBe(25);
  });

  it('should handle optional fields', async () => {
    const schema = z.object({
      name: z.string(),
      nickname: z.string().optional(),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: { name: 'John' },
      }),
    );

    await result.current.trigger();

    // Use type assertion since TypeScript can't infer optional fields from schema
    expect(
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Dynamic property access */
      (result.current.formState.errors as Record<string, unknown>).nickname,
    ).toBeUndefined();
  });

  it('should handle nested objects', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: {
          user: {
            name: 'John',
            email: 'john@example.com',
          },
        },
      }),
    );

    const values = result.current.getValues();
    expect(values.user).toBeDefined();
    expect(values.user?.name).toBe('John');
    expect(values.user?.email).toBe('john@example.com');
  });

  it('should handle arrays', () => {
    const schema = z.object({
      tags: z.array(z.string().min(1)),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: {
          tags: ['react', 'typescript'],
        },
      }),
    );

    const values = result.current.getValues();
    expect(values.tags).toEqual(['react', 'typescript']);
    expect(Array.isArray(values.tags)).toBe(true);
  });

  it('should accept zodResolverOptions', () => {
    const schema = z.object({
      name: z.string(),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: { name: '' },
        zodResolverOptions: {},
      }),
    );

    expect(result.current).toBeDefined();
  });

  it('should handle default values from schema', async () => {
    const schema = z.object({
      name: z.string().default('John'),
      age: z.number().default(25),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        // No defaultValues provided
      }),
    );

    expect(result.current).toBeDefined();
  });

  it('should pass through form options', () => {
    const schema = z.object({
      name: z.string(),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: { name: '' },
        mode: 'onBlur',
        reValidateMode: 'onChange',
      }),
    );

    expect(result.current.formState).toBeDefined();
  });

  it('should work without defaultValues for simple schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        // No defaultValues provided
      }),
    );

    expect(result.current).toBeDefined();
    expect(result.current.setValue).toBeDefined();
    expect(result.current.getValues).toBeDefined();
  });

  it('should work without defaultValues for nested schema', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
        profile: z.object({
          bio: z.string(),
          age: z.number(),
        }),
      }),
      tags: z.array(z.string()),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        // No defaultValues provided - all fields optional during editing
      }),
    );

    expect(result.current).toBeDefined();

    // Should be able to set values individually
    result.current.setValue('user.name', 'John');
    result.current.setValue('tags', ['react']);

    expect(result.current.getValues('user.name')).toBe('John');
    expect(result.current.getValues('tags')).toEqual(['react']);
  });

  it('should allow setValue and reset without defaultValues', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        // No defaultValues
      }),
    );

    // Should be able to set values
    result.current.setValue('name', 'Alice');
    result.current.setValue('email', 'alice@example.com');

    expect(result.current.getValues('name')).toBe('Alice');
    expect(result.current.getValues('email')).toBe('alice@example.com');

    // Should be able to reset with new values
    result.current.reset({ name: 'Bob', email: 'bob@example.com' });

    expect(result.current.getValues('name')).toBe('Bob');
    expect(result.current.getValues('email')).toBe('bob@example.com');
  });

  describe('schemas with transforms', () => {
    it('should handle schema with transform', () => {
      const schema = z
        .object({
          name: z.string(),
          age: z.number(),
        })
        .transform((data) => ({
          ...data,
          displayName: data.name.toUpperCase(),
        }));

      const { result } = renderHook(() =>
        useZodForm({
          schema,
          defaultValues: { name: 'John', age: 25 },
        }),
      );

      expect(result.current).toBeDefined();
      expect(result.current.getValues('name')).toBe('John');
    });

    it('should handle optional fields with transform', () => {
      const schema = z
        .object({
          name: z.string(),
          bio: z.string().optional(),
        })
        .transform((data) => ({
          ...data,
          hasBio: !!data.bio,
        }));

      const { result } = renderHook(() =>
        useZodForm({
          schema,
          defaultValues: { name: 'John' },
        }),
      );

      expect(result.current).toBeDefined();
      result.current.setValue('bio', 'Hello world');
      expect(result.current.getValues('bio')).toBe('Hello world');
    });

    it('should handle default values with transform', () => {
      const schema = z
        .object({
          count: z.number().default(0),
          name: z.string().default('Anonymous'),
        })
        .transform((data) => ({
          ...data,
          label: `${data.name} (${data.count})`,
        }));

      const { result } = renderHook(() =>
        useZodForm({
          schema,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it('should handle multiple transforms', () => {
      const schema = z
        .object({
          value: z.string(),
        })
        .transform((data) => ({ ...data, step1: true }))
        .transform((data) => ({ ...data, step2: true }));

      const { result } = renderHook(() =>
        useZodForm({
          schema,
          defaultValues: { value: 'test' },
        }),
      );

      expect(result.current).toBeDefined();
      expect(result.current.getValues('value')).toBe('test');
    });
  });

  describe('discriminated union schemas', () => {
    it('should handle discriminated union schema', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('create'),
          name: z.string(),
          description: z.string().optional(),
        }),
        z.object({
          type: z.literal('edit'),
          id: z.number(),
          name: z.string().optional(),
        }),
      ]);

      const { result } = renderHook(() =>
        useZodForm({
          schema,
          defaultValues: { type: 'create', name: 'New Item' },
        }),
      );

      expect(result.current).toBeDefined();
      expect(result.current.getValues('type')).toBe('create');
      expect(result.current.getValues('name')).toBe('New Item');
    });

    it('should handle discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('mode', [
          z.object({
            mode: z.literal('active'),
            count: z.number(),
          }),
          z.object({
            mode: z.literal('inactive'),
            reason: z.string(),
          }),
        ])
        .transform((data) => ({ ...data, processed: true }));

      const { result } = renderHook(() =>
        useZodForm({
          schema,
          defaultValues: { mode: 'active', count: 5 },
        }),
      );

      expect(result.current).toBeDefined();
      expect(result.current.getValues('mode')).toBe('active');
      expect(result.current.getValues('count')).toBe(5);
    });

    it('should handle discriminated union with superRefine', () => {
      const schema = z
        .discriminatedUnion('status', [
          z.object({
            status: z.literal('success'),
            data: z.string(),
          }),
          z.object({
            status: z.literal('error'),
            message: z.string(),
          }),
        ])
        .superRefine(() => {});

      const { result } = renderHook(() =>
        useZodForm({
          schema,
          defaultValues: { status: 'success', data: 'Hello' },
        }),
      );

      expect(result.current).toBeDefined();
      expect(result.current.getValues('status')).toBe('success');
    });

    it('should handle discriminated union with superRefine and transform', () => {
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

      const { result } = renderHook(() =>
        useZodForm({
          schema,
          defaultValues: { action: 'submit', payload: 'data' },
        }),
      );

      expect(result.current).toBeDefined();
      expect(result.current.getValues('action')).toBe('submit');
      expect(result.current.getValues('payload')).toBe('data');
    });

    it('should allow switching discriminator value', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('text'),
          content: z.string(),
        }),
        z.object({
          type: z.literal('number'),
          value: z.number(),
        }),
      ]);

      const { result } = renderHook(() =>
        useZodForm({
          schema,
          defaultValues: { type: 'text', content: 'Hello' },
        }),
      );

      // Switch to number type
      result.current.setValue('type', 'number');
      expect(result.current.getValues('type')).toBe('number');
    });
  });
});
