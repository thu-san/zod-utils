import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelectorProps,
  NameAndDiscriminatorProps,
  SchemaProps,
} from '@zod-utils/core';
import {
  extractFieldFromSchema,
  requiresValidInput,
  useExtractFieldFromSchema,
  useIsRequiredField,
} from '@zod-utils/react-hook-form';
import { useTranslations } from 'next-intl';
import type { ComponentProps, JSX } from 'react';
import type z from 'zod';
import { FormLabel } from '@/components/ui/form';

export const useFieldLabel = <
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(
  params: FieldSelectorProps<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >,
) => {
  const field = useExtractFieldFromSchema(params);

  const t = useTranslations();
  const translationKey = field?.meta()?.translationKey;
  const value = translationKey ? t(translationKey) : 'This field';

  return value;
};

export function TFormLabel<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(
  props: Omit<ComponentProps<typeof FormLabel>, 'children'> &
    FieldSelectorProps<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    >,
) {
  const label = useFieldLabel(props);

  const field = extractFieldFromSchema(props);
  const isRequired = field ? requiresValidInput(field) : false;

  const isRequiredOld = useIsRequiredField(props);

  return (
    <FormLabel {...props}>
      {label}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </FormLabel>
  );
}

export function createTFormLabel<TSchema extends z.ZodType>(
  factoryProps: SchemaProps<TSchema> & JSX.IntrinsicAttributes,
) {
  return function BoundTFormLabel<
    TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    > = never,
    TFilterType = unknown,
    TStrict extends boolean = true,
  >(
    props: Omit<ComponentProps<typeof FormLabel>, 'children'> &
      NameAndDiscriminatorProps<
        TSchema,
        TDiscriminatorKey,
        TDiscriminatorValue,
        TFilterType,
        TStrict
      >,
  ) {
    return <TFormLabel {...factoryProps} {...props} />;
  };
}
