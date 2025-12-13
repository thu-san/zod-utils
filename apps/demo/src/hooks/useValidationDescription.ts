'use client';

import type {
  Discriminator,
  DiscriminatorKey,
  DiscriminatorValue,
  ValidPaths,
} from '@zod-utils/core';
import { useFieldChecks } from '@zod-utils/react-hook-form';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';

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
 * @param params.name - The name of the field to generate description for
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
  TSchema extends z.ZodType,
  TPath extends ValidPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(params: {
  schema: TSchema;
  name: TPath;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
}): string {
  const t = useTranslations('user.validation');

  // Get all validation checks from the field (memoized)
  const checks = useFieldChecks(
    // biome-ignore lint/suspicious/noExplicitAny: Conditional type unification workaround
    params as any, // eslint-disable-line @typescript-eslint/consistent-type-assertions
  );

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
