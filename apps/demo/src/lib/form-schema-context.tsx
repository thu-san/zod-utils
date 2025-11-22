'use client';

import {
  extractDiscriminatedSchema,
  requiresValidInput,
} from '@zod-utils/core';
import { createContext, useContext } from 'react';
import { z } from 'zod';

type ZodSchema = z.ZodObject<{
  [key: string]: z.ZodType;
}>;

type FormSchema = ZodSchema | z.ZodDiscriminatedUnion<ZodSchema[], string>;

type DiscriminatorValue = {
  discriminator: string;
  value: string | number | boolean;
} | null;

// Context to provide Zod schema to child components
export const FormSchemaContext = createContext<{
  schema: FormSchema;
  discriminatorValue?: DiscriminatorValue;
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
export function FormSchemaProvider({
  schema,
  discriminatorValue,
  children,
}: {
  schema: FormSchema;
  discriminatorValue?: DiscriminatorValue;
  children: React.ReactNode;
}) {
  return (
    <FormSchemaContext.Provider value={{ schema, discriminatorValue }}>
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
  const context = useContext(FormSchemaContext);

  if (!context) {
    return false;
  }

  return isFieldRequired(context.schema, fieldName, context.discriminatorValue);
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
export function isFieldRequired(
  schema: FormSchema,
  fieldName: string,
  discriminatorValue?: DiscriminatorValue,
): boolean {
  let field: z.ZodType | undefined;

  if (schema instanceof z.ZodDiscriminatedUnion) {
    if (discriminatorValue) {
      const { discriminator, value } = discriminatorValue;

      const filteredSchema = extractDiscriminatedSchema({
        schema,
        discriminatorField: discriminator,
        discriminatorValue: value,
      });

      if (filteredSchema) {
        field = filteredSchema.shape[fieldName];
      }
    }
  } else {
    field = schema.shape[fieldName];
  }

  if (!field) {
    return false;
  }

  // Use the comprehensive check from @zod-utils/core
  return requiresValidInput(field);
}
