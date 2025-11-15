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
});
