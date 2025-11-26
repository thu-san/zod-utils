'use client';

import {
  type Discriminator,
  type DiscriminatorKey,
  type DiscriminatorValue,
  extractFieldFromSchema,
  requiresValidInput,
} from '@zod-utils/core';
import { type Context, createContext, type ReactNode, useContext } from 'react';
import type { z } from 'zod';

/**
 * Type for the FormSchemaContext with full generic support.
 * @internal
 */
export type FormSchemaContextType<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
> = Context<{
  schema: TSchema;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
} | null>;

/**
 * Context value type for FormSchemaContext.
 */
export type FormSchemaContextValue<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
> = {
  schema: TSchema;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
} | null;

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
  _params?: {
    schema: TSchema;
    discriminator?: Discriminator<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue
    >;
  },
): FormSchemaContextValue<TSchema, TDiscriminatorKey, TDiscriminatorValue> {
  return useContext(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    FormSchemaContext as Context<{
      schema: TSchema;
      discriminator?: Discriminator<
        TSchema,
        TDiscriminatorKey,
        TDiscriminatorValue
      >;
    } | null>,
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
}: {
  schema: TSchema;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
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
 * Uses the schema from {@link FormSchemaContext} to determine if a field
 * will show validation errors when submitted with empty/invalid input.
 *
 * @param params - Schema, field name, and optional discriminator (schema used for type inference)
 * @returns true if the field requires valid input, false otherwise
 *
 * @example
 * ```tsx
 * function MyFieldLabel({ name, schema }: { name: string; schema: z.ZodType }) {
 *   const isRequired = useIsRequiredField({ schema, fieldName: name });
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
  TName extends keyof Extract<
    Required<z.input<TSchema>>,
    Record<TDiscriminatorKey, TDiscriminatorValue>
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>({
  fieldName,
  ...props
}: {
  schema: TSchema;
  fieldName: TName;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
}): boolean {
  const context = useFormSchema<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >(props);

  if (!context) {
    return false;
  }

  return isRequiredField({
    schema: context.schema,
    fieldName,
    discriminator: context.discriminator,
  });
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
 * isFieldRequired({ schema, fieldName: 'name' }); // true
 * isFieldRequired({ schema, fieldName: 'bio' });  // false
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
 * isFieldRequired({
 *   schema,
 *   fieldName: 'name',
 *   discriminator: { key: 'mode', value: 'create' },
 * }); // true
 * ```
 */
export function isRequiredField<
  TSchema extends z.ZodType,
  TName extends keyof Extract<
    Required<z.input<TSchema>>,
    Record<TDiscriminatorKey, TDiscriminatorValue>
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>({
  schema,
  fieldName,
  discriminator,
}: {
  schema: TSchema;
  fieldName: TName;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
}): boolean {
  const field = extractFieldFromSchema({
    schema,
    fieldName,
    discriminator,
  });

  if (!field) {
    return false;
  }

  return requiresValidInput(field);
}
