import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import {
  FormSchemaContext,
  FormSchemaProvider,
  isRequiredField,
  useExtractFieldFromSchema,
  useFieldChecks,
  useFormSchema,
  useIsRequiredField,
} from '../context';

describe('FormSchemaContext', () => {
  it('should be a React context', () => {
    expect(FormSchemaContext).toBeDefined();
    expect(FormSchemaContext.Provider).toBeDefined();
  });
});

describe('FormSchemaProvider', () => {
  it('should provide schema to children', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result } = renderHook(() => useFormSchema({ schema }), { wrapper });

    expect(result.current).not.toBeNull();
    expect(result.current?.schema).toBe(schema);
    expect(result.current?.discriminator).toBeUndefined();
  });

  it('should provide schema with discriminator', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    const discriminator = { key: 'mode', value: 'create' } as const;

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema} discriminator={discriminator}>
        {children}
      </FormSchemaProvider>
    );

    const { result } = renderHook(
      () =>
        useFormSchema({
          schema,
          discriminator,
        }),
      { wrapper },
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.schema).toBe(schema);
    expect(result.current?.discriminator).toEqual({
      key: 'mode',
      value: 'create',
    });
  });
});

describe('useFormSchema', () => {
  it('should return null when not in provider', () => {
    const schema = z.object({ name: z.string() });
    const { result } = renderHook(() => useFormSchema({ schema }));

    expect(result.current).toBeNull();
  });

  it('should return schema context when in provider', () => {
    const schema = z.object({ name: z.string() });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result } = renderHook(() => useFormSchema({ schema }), { wrapper });

    expect(result.current).not.toBeNull();
    expect(result.current?.schema).toBe(schema);
  });
});

describe('useIsRequiredField', () => {
  it('should return false when not in provider', () => {
    const schema = z.object({ name: z.string() });
    const { result } = renderHook(() =>
      useIsRequiredField({ schema, name: 'name' }),
    );

    expect(result.current).toBe(false);
  });

  it('should return true for required field', () => {
    const schema = z.object({
      name: z.string().min(1),
      bio: z.string().optional(),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result: nameResult } = renderHook(
      () => useIsRequiredField({ schema, name: 'name' }),
      { wrapper },
    );
    expect(nameResult.current).toBe(true);

    const { result: bioResult } = renderHook(
      () => useIsRequiredField({ schema, name: 'bio' }),
      { wrapper },
    );
    expect(bioResult.current).toBe(false);
  });

  it('should handle discriminated union', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        name: z.string().min(1),
      }),
      z.object({
        mode: z.literal('edit'),
        id: z.number(),
        name: z.string().optional(),
      }),
    ]);

    const createDiscriminator = { key: 'mode', value: 'create' } as const;
    const editDiscriminator = { key: 'mode', value: 'edit' } as const;

    const createWrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema} discriminator={createDiscriminator}>
        {children}
      </FormSchemaProvider>
    );

    const { result: createNameResult } = renderHook(
      () =>
        useIsRequiredField({
          schema,
          name: 'name',
          discriminator: createDiscriminator,
        }),
      { wrapper: createWrapper },
    );
    expect(createNameResult.current).toBe(true);

    const editWrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema} discriminator={editDiscriminator}>
        {children}
      </FormSchemaProvider>
    );

    const { result: editNameResult } = renderHook(
      () =>
        useIsRequiredField({
          schema,
          name: 'name',
          discriminator: editDiscriminator,
        }),
      { wrapper: editWrapper },
    );
    expect(editNameResult.current).toBe(false);
  });
});

describe('isRequiredField', () => {
  it('should return true for required string with min(1)', () => {
    const schema = z.object({
      name: z.string().min(1),
    });

    expect(isRequiredField({ schema, name: 'name' })).toBe(true);
  });

  it('should return false for optional field', () => {
    const schema = z.object({
      bio: z.string().optional(),
    });

    expect(isRequiredField({ schema, name: 'bio' })).toBe(false);
  });

  it('should return false for nullable field', () => {
    const schema = z.object({
      nickname: z.string().nullable(),
    });

    expect(isRequiredField({ schema, name: 'nickname' })).toBe(false);
  });

  it('should return true for number field (requires valid input)', () => {
    const schema = z.object({
      age: z.number(),
    });

    expect(isRequiredField({ schema, name: 'age' })).toBe(true);
  });

  it('should return false for number with default', () => {
    const schema = z.object({
      count: z.number().optional(),
    });

    expect(isRequiredField({ schema, name: 'count' })).toBe(false);
  });

  it('should return false for plain string (accepts empty)', () => {
    const schema = z.object({
      notes: z.string(),
    });

    expect(isRequiredField({ schema, name: 'notes' })).toBe(false);
  });

  it('should return false for non-existent field', () => {
    const schema = z.object({
      name: z.string(),
    });

    expect(
      isRequiredField({
        schema,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: 'nonexistent' as unknown as 'name',
      }),
    ).toBe(false);
  });

  it('should handle discriminated union with discriminator', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('a'),
        value: z.string().min(1),
      }),
      z.object({
        type: z.literal('b'),
        count: z.number(),
      }),
    ]);

    expect(
      isRequiredField({
        schema,
        name: 'value',
        discriminator: { key: 'type', value: 'a' },
      }),
    ).toBe(true);

    expect(
      isRequiredField({
        schema,
        name: 'count',
        discriminator: { key: 'type', value: 'b' },
      }),
    ).toBe(true);
  });

  it('should return false for discriminated union without discriminator', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    // Without discriminator, can't determine which variant to check
    expect(
      // @ts-expect-error - Testing runtime behavior with undefined schema
      isRequiredField({ schema, name: 'name' }),
    ).toBe(false);
  });

  it('should handle schema with transform', () => {
    const schema = z
      .object({
        name: z.string().min(1),
        bio: z.string().optional(),
      })
      .transform((data) => ({ ...data, computed: true }));

    expect(isRequiredField({ schema, name: 'name' })).toBe(true);
    expect(isRequiredField({ schema, name: 'bio' })).toBe(false);
  });
});

describe('useExtractFieldFromSchema', () => {
  it('should extract field schema from object', () => {
    const schema = z.object({
      name: z.string().min(3).max(20),
      age: z.number(),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result } = renderHook(
      () => useExtractFieldFromSchema({ schema, name: 'name' }),
      { wrapper },
    );

    expect(result.current).toBeDefined();
    expect(result.current).toBeInstanceOf(z.ZodString);
  });

  it('should return undefined for non-existent field', () => {
    const schema = z.object({
      name: z.string(),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result } = renderHook(
      () =>
        useExtractFieldFromSchema({
          schema,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          name: 'nonexistent' as unknown as 'name',
        }),
      { wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it('should extract field from discriminated union with discriminator', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider
        schema={schema}
        discriminator={{ key: 'mode', value: 'edit' }}
      >
        {children}
      </FormSchemaProvider>
    );

    const { result } = renderHook(
      () =>
        useExtractFieldFromSchema({
          schema,
          name: 'id',
          discriminator: { key: 'mode', value: 'edit' } as const,
        }),
      { wrapper },
    );

    expect(result.current).toBeDefined();
    expect(result.current).toBeInstanceOf(z.ZodNumber);
  });
});

describe('useFieldChecks', () => {
  it('should work without provider (takes schema directly)', () => {
    const schema = z.object({
      name: z.string().min(3).max(20),
    });

    const { result } = renderHook(() =>
      useFieldChecks({ schema, name: 'name' }),
    );

    // Works without provider since schema is passed directly
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((c) => c.check === 'min_length')).toBe(true);
    expect(result.current.some((c) => c.check === 'max_length')).toBe(true);
  });

  it('should return validation checks for field', () => {
    const schema = z.object({
      name: z.string().min(3).max(20),
      age: z.number(),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result } = renderHook(
      () => useFieldChecks({ schema, name: 'name' }),
      { wrapper },
    );

    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((c) => c.check === 'min_length')).toBe(true);
    expect(result.current.some((c) => c.check === 'max_length')).toBe(true);
  });

  it('should return empty array for field without checks', () => {
    const schema = z.object({
      name: z.string(),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result } = renderHook(
      () => useFieldChecks({ schema, name: 'name' }),
      { wrapper },
    );

    expect(result.current).toEqual([]);
  });

  it('should return empty array for non-existent field', () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result } = renderHook(
      () =>
        useFieldChecks({
          schema,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          name: 'nonexistent' as unknown as 'name',
        }),
      { wrapper },
    );

    expect(result.current).toEqual([]);
  });

  it('should handle discriminated union with discriminator', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string().min(1).max(50) }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider
        schema={schema}
        discriminator={{ key: 'mode', value: 'create' }}
      >
        {children}
      </FormSchemaProvider>
    );

    const { result } = renderHook(
      () =>
        useFieldChecks({
          schema,
          name: 'name',
          discriminator: { key: 'mode', value: 'create' },
        }),
      { wrapper },
    );

    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((c) => c.check === 'min_length')).toBe(true);
    expect(result.current.some((c) => c.check === 'max_length')).toBe(true);
  });

  it('should handle number field checks', () => {
    const schema = z.object({
      age: z.number().min(18).max(120),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider schema={schema}>{children}</FormSchemaProvider>
    );

    const { result } = renderHook(
      () => useFieldChecks({ schema, name: 'age' }),
      { wrapper },
    );

    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((c) => c.check === 'greater_than')).toBe(true);
    expect(result.current.some((c) => c.check === 'less_than')).toBe(true);
  });
});
