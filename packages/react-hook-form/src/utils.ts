import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelector,
  ValidPaths,
} from '@zod-utils/core';
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
export function flattenFieldSelector<
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
) {
  const { discriminator, ...rest } = params;

  return [
    ...Object.values(rest),
    ...(discriminator ? Object.values(discriminator) : []),
  ];
}
