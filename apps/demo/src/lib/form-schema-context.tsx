'use client';

import { checkIfFieldIsRequired } from '@zod-utils/core';
import { createContext, useContext } from 'react';
import type { z } from 'zod';

// Context to provide Zod schema to child components
const FormSchemaContext = createContext<z.ZodObject<z.ZodRawShape> | null>(
  null,
);

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
 * Utility function to check if a field in a Zod schema is required
 *
 * Uses the comprehensive checkIfFieldIsRequired from @zod-utils/core which:
 * - Checks for undefined (optional fields)
 * - Checks for null (nullable fields)
 * - Checks for empty strings (string().min(1) vs string())
 * - Checks for empty arrays (array().min(1) vs array())
 *
 * @param schema - The Zod object schema
 * @param fieldName - The name of the field to check
 * @returns true if the field is required, false otherwise
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
  return checkIfFieldIsRequired(field);
}
