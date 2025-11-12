'use client';

import { requiresValidInput } from '@zod-utils/core';
import { createContext, useContext } from 'react';
import type { z } from 'zod';

// Context to provide Zod schema to child components
export const FormSchemaContext =
  createContext<z.ZodObject<z.ZodRawShape> | null>(null);

/**
 * Provider component that makes Zod schema available to all child components
 *
 * @example
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
 */
export function FormSchemaProvider({
  schema,
  children,
}: {
  schema: z.ZodObject<z.ZodRawShape>;
  children: React.ReactNode;
}) {
  return (
    <FormSchemaContext.Provider value={schema}>
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
  const schema = useContext(FormSchemaContext);

  if (!schema) {
    return false;
  }

  return isFieldRequired(schema, fieldName);
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
 * @param schema - The Zod object schema
 * @param fieldName - The name of the field to check
 * @returns true if the field requires valid input (will show validation error), false otherwise
 */
export function isFieldRequired(
  schema: z.ZodObject<z.ZodRawShape>,
  fieldName: string,
): boolean {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const field = schema.shape[fieldName] as z.ZodTypeAny | undefined;

  if (!field) {
    return false;
  }

  // Use the comprehensive check from @zod-utils/core
  return requiresValidInput(field);
}
