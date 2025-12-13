'use client';

import {
  type DiscriminatorKey,
  type DiscriminatorValue,
  type ExtractZodByPath,
  extractFieldFromSchema,
  type FieldSelector,
  getFieldChecks,
  requiresValidInput,
  type ValidPaths,
  type ZodUnionCheck,
} from '@zod-utils/core';
import {
  type Context,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';
import type { z } from 'zod';
import { flattenFieldSelector } from './utils';

/**
 * Type for the FormSchemaContext with full generic support.
 * @internal
 */
export type FormSchemaContextType<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
> = Context<Omit<
  FieldSelector<
    TSchema,
    ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
    TDiscriminatorKey,
    TDiscriminatorValue
  >,
  'name'
> | null>;

/**
 * Context value type for FormSchemaContext.
 */
export type FormSchemaContextValue<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
> = Omit<
  FieldSelector<
    TSchema,
    ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
    TDiscriminatorKey,
    TDiscriminatorValue
  >,
  'name'
> | null;

/**
 * React Context for providing Zod schema to form components.
 *
 * Use with {@link FormSchemaProvider} to provide schema context, and
 * {@link useFormSchema} to consume it in child components.
 */
export const FormSchemaContext = createContext<{
  schema: z.ZodType;
  discriminator?: {
    key: unknown;
    value: unknown;
  };
} | null>(null);

/**
 * Hook to access the form schema from context.
 *
 * The optional `_params` argument is used for TypeScript type inference only.
 * Pass your schema to get proper type narrowing of the context value.
 *
 * @param _params - Optional params for type inference (not used at runtime)
 * @returns The schema context value or null if not within a provider
 *
 * @example
 * ```tsx
 * // Without type params (returns generic context)
 * function MyFormField() {
 *   const context = useFormSchema();
 *   if (!context) return null;
 *
 *   const { schema, discriminator } = context;
 *   // Use schema for validation or field extraction
 * }
 *
 * // With type params (for type-safe schema access)
 * function TypedFormField() {
 *   const context = useFormSchema({ schema: mySchema });
 *   // context.schema is now typed as typeof mySchema
 * }
 * ```
 */
export function useFormSchema<
  TSchema extends z.ZodType = z.ZodType,
  TDiscriminatorKey extends
    DiscriminatorKey<TSchema> = DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = DiscriminatorValue<TSchema, TDiscriminatorKey>,
>(
  // Parameter used for type inference only, not at runtime
  _params?: Omit<
    FieldSelector<
      TSchema,
      ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
      TDiscriminatorKey,
      TDiscriminatorValue
    >,
    'name'
  >,
): FormSchemaContextValue<TSchema, TDiscriminatorKey, TDiscriminatorValue> {
  return useContext(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    FormSchemaContext as Context<Omit<
      FieldSelector<
        TSchema,
        ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
        TDiscriminatorKey,
        TDiscriminatorValue
      >,
      'name'
    > | null>,
  );
}

/**
 * Provider component that makes Zod schema available to all child components.
 *
 * Use this to wrap your form and provide schema context to nested components
 * like field labels and validation indicators.
 *
 * @example
 * Basic usage with ZodObject
 * ```tsx
 * const schema = z.object({
 *   name: z.string(),
 *   email: z.string().email().optional()
 * });
 *
 * <FormSchemaProvider schema={schema}>
 *   <YourFormComponents />
 * </FormSchemaProvider>
 * ```
 *
 * @example
 * Usage with discriminated union
 * ```tsx
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() })
 * ]);
 *
 * <FormSchemaProvider
 *   schema={schema}
 *   discriminator={{ key: 'mode', value: 'create' }}
 * >
 *   <YourFormComponents />
 * </FormSchemaProvider>
 * ```
 */
export function FormSchemaProvider<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>({
  schema,
  discriminator,
  children,
}: Omit<
  FieldSelector<
    TSchema,
    ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
    TDiscriminatorKey,
    TDiscriminatorValue
  >,
  'name'
> & {
  children: ReactNode;
}) {
  return (
    <FormSchemaContext.Provider value={{ schema, discriminator }}>
      {children}
    </FormSchemaContext.Provider>
  );
}

/**
 * Hook to check if a field requires valid input based on the Zod schema.
 *
 * Memoized - only recalculates when schema, name, or discriminator changes.
 *
 * @param params - Schema, name, and optional discriminator (schema and name are optional)
 * @returns true if the field requires valid input, false if it doesn't or if schema/name is not provided
 *
 * @example
 * ```tsx
 * function MyFieldLabel({ name, schema }: { name: string; schema: z.ZodType }) {
 *   const isRequired = useIsRequiredField({ schema, name });
 *
 *   return (
 *     <label>
 *       {name}
 *       {isRequired && <span className="text-red-500">*</span>}
 *     </label>
 *   );
 * }
 * ```
 */
export function useIsRequiredField<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>(
  params:
    | FieldSelector<TSchema, TPath, TDiscriminatorKey, TDiscriminatorValue>
    | {
        schema?: undefined;
        name?: undefined;
        discriminator?: undefined;
      },
): boolean {
  // biome-ignore lint/correctness/useExhaustiveDependencies: using flattenFieldSelector for stable deps
  return useMemo(() => {
    if (!params.schema || !params.name) {
      return false;
    }

    return isRequiredField(params);
  }, [...flattenFieldSelector(params)]);
}

/**
 * Determines if a field requires valid input (will show validation errors on empty/invalid input).
 *
 * Uses `requiresValidInput` from `@zod-utils/core` which checks the underlying field after
 * removing defaults. This tells you if the field will error when user submits empty input.
 *
 * Returns false if the underlying field accepts:
 * - `undefined` (via `.optional()`)
 * - `null` (via `.nullable()`)
 * - Empty strings (plain `z.string()` without `.min(1)`)
 * - Empty arrays (plain `z.array()` without `.min(1)`)
 *
 * @param options - Schema, field name, and optional discriminator
 * @returns true if the field requires valid input, false otherwise
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: z.string().min(1),
 *   bio: z.string().optional(),
 * });
 *
 * isRequiredField({ schema, name: 'name' }); // true
 * isRequiredField({ schema, name: 'bio' });  // false
 * ```
 *
 * @example
 * With discriminated union
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string().min(1) }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 *
 * isRequiredField({
 *   schema,
 *   name: 'name',
 *   discriminator: { key: 'mode', value: 'create' },
 * }); // true
 * ```
 */
export function isRequiredField<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>(
  params: FieldSelector<TSchema, TPath, TDiscriminatorKey, TDiscriminatorValue>,
): boolean {
  const field = extractFieldFromSchema(params);

  if (!field) {
    return false;
  }

  return requiresValidInput(field);
}

/**
 * React hook to extract a field's Zod schema from a parent schema.
 *
 * Memoized - only recalculates when schema, name, or discriminator changes.
 * Supports nested paths and discriminated unions.
 *
 * @param params - Schema, name, and optional discriminator
 * @returns The Zod schema for the field, or undefined if not found
 *
 * @example
 * ```tsx
 * function MyFieldInfo({ name, schema }: { name: string; schema: z.ZodType }) {
 *   const fieldSchema = useExtractFieldFromSchema({ schema, name });
 *
 *   if (!fieldSchema) return null;
 *
 *   // Use fieldSchema for custom validation or field info
 *   return <span>{fieldSchema._zod.typeName}</span>;
 * }
 * ```
 *
 * @example
 * With discriminated union
 * ```tsx
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 *
 * const fieldSchema = useExtractFieldFromSchema({
 *   schema,
 *   name: 'name',
 *   discriminator: { key: 'mode', value: 'create' },
 * });
 * // Returns z.string() schema
 * ```
 */
export function useExtractFieldFromSchema<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>(
  params: FieldSelector<TSchema, TPath, TDiscriminatorKey, TDiscriminatorValue>,
): (ExtractZodByPath<TSchema, TPath> & z.ZodType) | undefined {
  // biome-ignore lint/correctness/useExhaustiveDependencies: using flattenFieldSelector for stable deps
  return useMemo(
    () => extractFieldFromSchema(params),
    [...flattenFieldSelector(params)],
  );
}

/**
 * Hook to get validation checks from a field's Zod schema.
 *
 * Memoized - only recalculates when schema, name, or discriminator changes.
 * Combines field extraction and check retrieval in one cached operation.
 *
 * @param params - Schema, name, and optional discriminator
 * @returns Array of validation checks (min, max, pattern, etc.) or empty array
 *
 * @example
 * ```tsx
 * function MyFieldHint({ schema, name }: { schema: z.ZodType; name: string }) {
 *   const checks = useFieldChecks({ schema, name });
 *
 *   const maxLength = checks.find(c => c.check === 'max_length');
 *   if (maxLength) {
 *     return <span>Max {maxLength.maximum} characters</span>;
 *   }
 *   return null;
 * }
 * ```
 */
export function useFieldChecks<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>(
  params: FieldSelector<TSchema, TPath, TDiscriminatorKey, TDiscriminatorValue>,
): ZodUnionCheck[] {
  // biome-ignore lint/correctness/useExhaustiveDependencies: using flattenFieldSelector for stable deps
  return useMemo(() => {
    const field = extractFieldFromSchema(params);
    if (!field) return [];
    return getFieldChecks(field);
  }, [...flattenFieldSelector(params)]);
}
