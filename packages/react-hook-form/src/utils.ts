import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelector,
  ValidPaths,
} from '@zod-utils/core';
import type { z } from 'zod';
import type {
  FormFieldSelector,
  InferredFieldValues,
  ValidFieldPaths,
} from './types';

/**
 * Extracts a FormFieldSelector from props containing schema, name, and optional discriminator.
 * Encapsulates type assertion so callers don't need eslint-disable.
 *
 * @param props - Object containing schema, name, and optional discriminator
 * @returns Properly typed FormFieldSelector
 *
 * @example
 * ```typescript
 * const selectorProps = toFormFieldSelector<TSchema, TPath, ...>(props);
 * ```
 */
export function toFormFieldSelector<
  TSchema extends z.ZodType,
  TPath extends ValidFieldPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
  TFieldValues extends
    InferredFieldValues<TSchema> = InferredFieldValues<TSchema>,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(props: {
  schema: z.ZodType;
  name: string;
  discriminator?: { key: string; value: unknown };
}): FormFieldSelector<
  TSchema,
  TPath,
  TDiscriminatorKey,
  TDiscriminatorValue,
  TFieldValues,
  TFilterType,
  TStrict
> {
  const { schema, name, discriminator } = props;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { schema, name, discriminator } as FormFieldSelector<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  >;
}

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
>(
  params:
    | FieldSelector<
        TSchema,
        TPath,
        TDiscriminatorKey,
        TDiscriminatorValue,
        TFilterType,
        TStrict
      >
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
