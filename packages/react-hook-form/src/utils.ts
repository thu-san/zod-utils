import type { z } from 'zod';

/**
 * Flattens a FieldSelector into an array of primitive values for use in React dependency arrays.
 *
 * This is useful for `useMemo` and `useCallback` dependencies where you want to avoid
 * re-running when object references change but values stay the same.
 *
 * @param params - The FieldSelector containing schema, name, and optional discriminator
 * @returns An array of primitive values suitable for React dependency arrays
 *
 * @example
 * ```tsx
 * const memoizedValue = useMemo(() => {
 *   return extractFieldFromSchema(params);
 * }, flattenFieldSelector(params));
 * ```
 */
export function flattenFieldSelector(params?: {
  schema?: z.ZodType;
  name?: string;
  discriminator?: { key: unknown; value: unknown };
}) {
  return [
    params?.schema,
    params?.name,
    params?.discriminator?.key,
    params?.discriminator?.value,
  ];
}
