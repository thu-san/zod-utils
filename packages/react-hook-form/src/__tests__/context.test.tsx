import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import {
  FormSchemaContext,
  FormSchemaProvider,
  isRequiredField,
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
        useFormSchema({
          schema,
          discriminator: { key: 'mode', value: 'create' },
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
      useIsRequiredField({ schema, fieldName: 'name' }),
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
      () => useIsRequiredField({ schema, fieldName: 'name' }),
      { wrapper },
    );
    expect(nameResult.current).toBe(true);

    const { result: bioResult } = renderHook(
      () => useIsRequiredField({ schema, fieldName: 'bio' }),
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

    const createWrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider
        schema={schema}
        discriminator={{ key: 'mode', value: 'create' }}
      >
        {children}
      </FormSchemaProvider>
    );

    const { result: createNameResult } = renderHook(
      () =>
        useIsRequiredField({
          schema,
          fieldName: 'name',
          discriminator: { key: 'mode', value: 'create' },
        }),
      { wrapper: createWrapper },
    );
    expect(createNameResult.current).toBe(true);

    const editWrapper = ({ children }: { children: ReactNode }) => (
      <FormSchemaProvider
        schema={schema}
        discriminator={{ key: 'mode', value: 'edit' }}
      >
        {children}
      </FormSchemaProvider>
    );

    const { result: editNameResult } = renderHook(
      () =>
        useIsRequiredField({
          schema,
          fieldName: 'name',
          discriminator: { key: 'mode', value: 'edit' },
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

    expect(isRequiredField({ schema, fieldName: 'name' })).toBe(true);
  });

  it('should return false for optional field', () => {
    const schema = z.object({
      bio: z.string().optional(),
    });

    expect(isRequiredField({ schema, fieldName: 'bio' })).toBe(false);
  });

  it('should return false for nullable field', () => {
    const schema = z.object({
      nickname: z.string().nullable(),
    });

    expect(isRequiredField({ schema, fieldName: 'nickname' })).toBe(false);
  });

  it('should return true for number field (requires valid input)', () => {
    const schema = z.object({
      age: z.number(),
    });

    expect(isRequiredField({ schema, fieldName: 'age' })).toBe(true);
  });

  it('should return false for number with default', () => {
    const schema = z.object({
      count: z.number().optional(),
    });

    expect(isRequiredField({ schema, fieldName: 'count' })).toBe(false);
  });

  it('should return false for plain string (accepts empty)', () => {
    const schema = z.object({
      notes: z.string(),
    });

    expect(isRequiredField({ schema, fieldName: 'notes' })).toBe(false);
  });

  it('should return false for non-existent field', () => {
    const schema = z.object({
      name: z.string(),
    });

    expect(
      isRequiredField({
        schema,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        fieldName: 'nonexistent' as unknown as 'name',
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
        fieldName: 'value',
        discriminator: { key: 'type', value: 'a' },
      }),
    ).toBe(true);

    expect(
      isRequiredField({
        schema,
        fieldName: 'count',
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
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      isRequiredField({ schema, fieldName: 'name' as unknown as 'mode' }),
    ).toBe(false);
  });

  it('should handle schema with transform', () => {
    const schema = z
      .object({
        name: z.string().min(1),
        bio: z.string().optional(),
      })
      .transform((data) => ({ ...data, computed: true }));

    expect(isRequiredField({ schema, fieldName: 'name' })).toBe(true);
    expect(isRequiredField({ schema, fieldName: 'bio' })).toBe(false);
  });
});
