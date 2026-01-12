import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelectorProps,
  NameAndDiscriminatorProps,
  SchemaProps,
} from '@zod-utils/core';
import type { ComponentProps, JSX } from 'react';
import { NumericFormat, type NumericFormatProps } from 'react-number-format';
import type z from 'zod';
import { Input } from '@/components/ui/input';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import { TFormField } from './TFormField';

type NumberFormFieldOwnProps = {
  autoPlaceholder?: boolean;
  placeholder?: string;
  description?: string;
} & Omit<
  NumericFormatProps<ComponentProps<typeof Input>>,
  'name' | 'placeholder' | 'onValueChange' | 'customInput' | 'getInputRef'
> &
  JSX.IntrinsicAttributes;

export function NumberFormField<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = number,
  TStrict extends boolean = false,
>(
  props: FieldSelectorProps<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  > &
    NumberFormFieldOwnProps,
) {
  // Auto-generate validation description if not provided
  const autoDescription = useValidationDescription(props);

  const finalDescription =
    props.description !== undefined ? props.description : autoDescription;

  return (
    <TFormField
      {...props}
      description={finalDescription}
      render={({ field, label }) => {
        // Convert any to acceptable NumericFormat value type
        const numericValue: number | string | null | undefined =
          typeof field.value === 'number' || typeof field.value === 'string'
            ? field.value
            : undefined;
        return (
          <NumericFormat
            customInput={Input}
            value={numericValue ?? ''}
            onValueChange={(values) => {
              // floatValue is undefined when input is empty, convert to null
              field.onChange(values.floatValue ?? null);
            }}
            onBlur={field.onBlur}
            name={field.name}
            getInputRef={field.ref}
            placeholder={
              props.placeholder ||
              (props.autoPlaceholder
                ? `Please enter ${label.toLowerCase()}`
                : undefined)
            }
          />
        );
      }}
    />
  );
}

export function createNumberFormField<TSchema extends z.ZodType>(
  factoryProps: SchemaProps<TSchema> & JSX.IntrinsicAttributes,
) {
  return function BoundNumberFormField<
    TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    > = never,
    TFilterType = number,
    TStrict extends boolean = false,
  >(
    props: NameAndDiscriminatorProps<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    > &
      NumberFormFieldOwnProps,
  ) {
    return <NumberFormField {...factoryProps} {...props} />;
  };
}
