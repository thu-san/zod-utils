import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelectorProps,
  NameAndDiscriminatorProps,
  SchemaProps,
} from '@zod-utils/core';
import type { ComponentProps, JSX } from 'react';
import type z from 'zod';
import { Input } from '@/components/ui/input';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import { TFormField } from './TFormField';

type NumberFormFieldOwnProps = {
  autoPlaceholder?: boolean;
  placeholder?: string;
  description?: string;
} & Omit<
  ComponentProps<typeof Input>,
  'name' | 'placeholder' | 'type' | 'onChange'
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
      render={({ field, label }) => (
        <Input
          type="number"
          value={field.value ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            // Convert empty string to null (works with nullable fields)
            field.onChange(value === '' ? null : Number(value));
          }}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          placeholder={
            props.placeholder ||
            (props.autoPlaceholder
              ? `Please enter ${label.toLowerCase()}`
              : undefined)
          }
        />
      )}
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
