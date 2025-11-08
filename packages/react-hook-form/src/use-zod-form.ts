import { zodResolver } from '@hookform/resolvers/zod';
import type { MakeOptionalAndNullable } from '@zod-utils/core';
import {
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  useForm,
} from 'react-hook-form';
import type { ZodTypeAny } from 'zod';

/**
 * Type-safe wrapper around useForm with Zod v4 schema integration
 * Automatically sets up zodResolver and provides better type inference
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * });
 *
 * const form = useZodForm({
 *   schema,
 *   defaultValues: { name: '', age: 0 }
 * });
 * ```
 */
export const useZodForm = <T extends FieldValues>({
  schema,
  zodResolverOptions,
  ...formOptions
}: {
  schema: ZodTypeAny;
  defaultValues?: DefaultValues<MakeOptionalAndNullable<T>>;
  zodResolverOptions?: Parameters<typeof zodResolver>[1];
} & Omit<
  UseFormProps<MakeOptionalAndNullable<T>, unknown, T>,
  'resolver' | 'defaultValues'
>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolver = zodResolver(schema as any, zodResolverOptions);

  return useForm({
    resolver,
    ...formOptions,
  });
};
