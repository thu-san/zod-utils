'use client';

import { createContext, useContext } from 'react';
import type { z } from 'zod';

// Context to provide Zod schema to child components
const FormSchemaContext = createContext<z.ZodObject<any> | null>(null);

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
  schema: z.ZodObject<any>;
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
 * @param schema - The Zod object schema
 * @param fieldName - The name of the field to check
 * @returns true if the field is required, false otherwise
 *
 * Works by testing if undefined is a valid value for the field.
 * If safeParse(undefined) fails, the field is required.
 */
export function isFieldRequired(
  schema: z.ZodObject<any>,
  fieldName: string,
): boolean {
  const field = schema.shape[fieldName];

  if (!field) {
    return false;
  }

  // If undefined parses successfully, the field is optional
  // If it fails, the field is required
  return !field.safeParse(undefined).success;
}
