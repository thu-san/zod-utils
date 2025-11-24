'use client';

import { extractFieldFromSchema, getFieldChecks } from '@zod-utils/core';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';
import type { util, z } from 'zod';
import {
  type FormContextType,
  type FormSchema,
  FormSchemaContext,
} from '../lib/form-schema-context';

/**
 * Hook to generate validation description from Zod schema checks
 *
 * Extracts validation constraints and formats them as a human-readable,
 * internationalized description string. Intentionally excludes `min_length`
 * as it's treated as a "required" indicator (shown via asterisk label).
 *
 * **Supported constraints:**
 * - `max_length` - Maximum length for strings/arrays
 * - `length_equals` - Exact length requirement
 * - `greater_than` - Minimum value for numbers/dates
 * - `less_than` - Maximum value for numbers/dates
 *
 * @param fieldName - The name of the field to generate description for
 * @returns Formatted validation description string (e.g., "Max 20") or empty string
 *
 * @example
 * Basic usage
 * ```tsx
 * function MyField() {
 *   const description = useValidationDescription('username');
 *   // For z.string().min(3).max(20): returns "Max 20" (min_length excluded)
 *   // For z.number().min(18).max(120): returns "Min 18, Max 120"
 *
 *   return <Input description={description} />;
 * }
 * ```
 *
 * @example
 * With manual override
 * ```tsx
 * <InputFormField
 *   name="bio"
 *   description="Custom description" // Overrides auto-generated description
 * />
 * ```
 */
export function useValidationDescription<
  TSchema extends FormSchema,
  TName extends keyof Extract<
    Required<z.infer<TSchema>>,
    Record<TDiscriminatorKey, TDiscriminatorValue>
  >,
  TDiscriminatorKey extends keyof z.infer<TSchema> & string,
  TDiscriminatorValue extends z.infer<TSchema>[TDiscriminatorKey] &
    util.Literal,
>(fieldName: string): string {
  const context = useContext(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    FormSchemaContext as FormContextType<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue
    >,
  );

  const t = useTranslations('user.validation');

  if (!context) {
    return '';
  }

  const field = extractFieldFromSchema({
    schema: context.schema,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    fieldName: fieldName as TName,
    discriminator: context.discriminator,
  });

  if (!field) {
    return '';
  }

  // Get all validation checks from the field
  const checks = getFieldChecks(field);

  // Filter to only max length and numeric range checks
  // Note: min_length is intentionally excluded as it indicates a "required" field,
  // which is already shown via the asterisk (*) in the field label
  const relevantChecks = checks.filter((check) => {
    return (
      check.check === 'max_length' ||
      check.check === 'length_equals' ||
      check.check === 'greater_than' ||
      check.check === 'less_than'
    );
  });

  if (relevantChecks.length === 0) {
    return '';
  }

  // Map each check to its translated string
  const descriptions = relevantChecks.map((check) => {
    // Build params object for i18n interpolation
    // Converts all check properties to strings for translation
    // Example: { check: 'max_length', maximum: 20 } → { check: 'max_length', maximum: '20' }
    // Allows translations like: "max_length": "Max {maximum}"
    const params: Record<string, string> = {};
    Object.entries(check).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[String(key)] = String(value);
      }
    });
    // Use check name as translation key: 'user.validation.max_length'
    return t(check.check, params);
  });

  // Join all descriptions with comma-space
  return descriptions.join(', ');
}
