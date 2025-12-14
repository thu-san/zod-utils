import {
  type DiscriminatorKey,
  type DiscriminatorValue,
  type FieldSelector,
  useExtractFieldFromSchema,
  useIsRequiredField,
  type ValidPaths,
} from '@zod-utils/react-hook-form';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import type z from 'zod';
import { FormLabel } from '@/components/ui/form';

export const useFieldLabel = <
  TSchema extends z.ZodType,
  TPath extends ValidPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  const TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  >,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(
  params: FieldSelector<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >,
) => {
  const field = useExtractFieldFromSchema<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >(params);

  const t = useTranslations();
  const translationKey = field?.meta()?.translationKey;
  const value = translationKey ? t(translationKey) : 'This field';

  return value;
};

export function TFormLabel<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  const TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  >,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(
  props: Omit<ComponentProps<typeof FormLabel>, 'children'> &
    FieldSelector<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    >,
) {
  const label = useFieldLabel<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >(props);

  const isRequired = useIsRequiredField<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >(props);

  return (
    <FormLabel {...props}>
      {label}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </FormLabel>
  );
}

export function createTFormLabel<TSchema extends z.ZodType>(factoryProps: {
  schema: TSchema;
}) {
  return function BoundTFormLabel<
    TPath extends ValidPaths<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    >,
    TDiscriminatorKey extends DiscriminatorKey<TSchema>,
    const TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    >,
    TFilterType = unknown,
    TStrict extends boolean = true,
  >(
    props: Omit<
      React.ComponentProps<
        typeof TFormLabel<
          TSchema,
          TPath,
          TDiscriminatorKey,
          TDiscriminatorValue,
          TFilterType,
          TStrict
        >
      >,
      'schema'
    >,
  ) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mergedProps = {
      ...factoryProps,
      ...props,
    } as React.ComponentProps<
      typeof TFormLabel<
        TSchema,
        TPath,
        TDiscriminatorKey,
        TDiscriminatorValue,
        TFilterType,
        TStrict
      >
    >;

    return TFormLabel<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    >(mergedProps);
  };
}
