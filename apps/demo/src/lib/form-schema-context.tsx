'use client';

import { extractFieldFromSchema, requiresValidInput } from '@zod-utils/core';
import { type Context, createContext, useContext } from 'react';
import type { util, z } from 'zod';

type ZodSchema = z.ZodObject<{
  [key: string]: z.ZodType;
}>;

export type FormSchema = ZodSchema | z.ZodDiscriminatedUnion;

export type FormContextType<
  TSchema extends FormSchema,
  TDiscriminatorKey extends keyof z.infer<TSchema> & string,
  TDiscriminatorValue extends z.infer<TSchema>[TDiscriminatorKey] &
    util.Literal,
> = Context<{
  schema: TSchema;
  discriminator?: {
    key: TDiscriminatorKey;
    value: TDiscriminatorValue;
  };
} | null>;

// Context to provide Zod schema to child components
export const FormSchemaContext = createContext<{
  schema: FormSchema;
  discriminator?: {
    key: unknown;
    value: unknown;
  };
} | null>(null);

/**
 * Provider component that makes Zod schema available to all child components
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
 *   z.object({ mode: z.literal('edit'), id: z.number(), name: z.string().optional() })
 * ]);
 *
 * <FormSchemaProvider
 *   schema={schema}
 *   discriminatorValue={{ discriminator: 'mode', value: 'create' }}
 * >
 *   <YourFormComponents />
 * </FormSchemaProvider>
 * ```
 */
export function FormSchemaProvider<
  TSchema extends FormSchema,
  TDiscriminatorKey extends keyof z.infer<TSchema> & string,
  TDiscriminatorValue extends z.infer<TSchema>[TDiscriminatorKey] &
    util.Literal,
>({
  schema,
  discriminator,
  children,
}: {
  schema: TSchema;
  discriminator?: {
    key: TDiscriminatorKey;
    value: TDiscriminatorValue;
  };
  children: React.ReactNode;
}) {
  return (
    <FormSchemaContext.Provider value={{ schema, discriminator }}>
      {children}
    </FormSchemaContext.Provider>
  );
}

/**
 * Hook to check if a field is required based on the Zod schema
 *
 * @param fieldName - The name of the field to check
 * @returns true if the field is required, false if optional or schema not provided
 *
 * @example
 * ```tsx
 * function MyFieldLabel({ fieldName, children }) {
 *   const isRequired = useIsFieldRequired(fieldName);
 *
 *   return (
 *     <label>
 *       {children}
 *       {isRequired && <span>*</span>}
 *     </label>
 *   );
 * }
 * ```
 */
export function useIsFieldRequired(fieldName: string): boolean {
  // as schema is got from context instead of prop, we need to assert types here
  type TSchema = FormSchema;
  type TDiscriminatorKey = keyof z.infer<TSchema> & string;
  type TDiscriminatorValue = z.infer<TSchema>[TDiscriminatorKey] & util.Literal;

  const context = useContext(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    FormSchemaContext as FormContextType<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue
    >,
  );

  if (!context) {
    return false;
  }

  return isFieldRequired({
    schema: context.schema,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    fieldName: fieldName as keyof z.infer<TSchema> & string,
    discriminator: context.discriminator,
  });
}

/**
 * Utility function to determine if a field will show validation errors on empty/invalid input
 *
 * Uses requiresValidInput from @zod-utils/core which checks the underlying field after
 * removing defaults. This tells you if the field will error when user submits empty input.
 *
 * Returns false if the underlying field accepts:
 * - undefined (via .optional())
 * - null (via .nullable())
 * - Empty strings (plain string() without .min(1))
 * - Empty arrays (plain array() without .min(1))
 *
 * Note: Fields with .default() are checked based on their underlying validation:
 * - number().default(0) → true (will error on empty input)
 * - string().default('hi') → false (won't error if user clears it)
 *
 * Supports both ZodObject and ZodDiscriminatedUnion schemas. For discriminated unions,
 * the discriminatorValue parameter must be provided to determine the active variant.
 *
 * @param schema - The Zod schema (object or discriminated union)
 * @param fieldName - The name of the field to check
 * @param discriminatorValue - Optional discriminator value for discriminated unions
 * @returns true if the field requires valid input (will show validation error), false otherwise
 */
export function isFieldRequired<
  TSchema extends FormSchema,
  TName extends keyof Extract<
    Required<z.infer<TSchema>>,
    Record<TDiscriminatorKey, TDiscriminatorValue>
  >,
  TDiscriminatorKey extends keyof z.infer<TSchema> & string,
  TDiscriminatorValue extends z.infer<TSchema>[TDiscriminatorKey] &
    util.Literal,
>({
  schema,
  fieldName,
  discriminator,
}: {
  schema: TSchema;
  fieldName: TName;
  discriminator?: {
    key: TDiscriminatorKey;
    value: TDiscriminatorValue;
  };
}): boolean {
  const field = extractFieldFromSchema({
    schema,
    fieldName,
    discriminator,
  });

  if (!field) {
    return false;
  }

  // Use the comprehensive check from @zod-utils/core
  return requiresValidInput(field);
}
