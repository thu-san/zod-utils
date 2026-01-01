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

type InputFormFieldOwnProps = {
  autoPlaceholder?: boolean;
  placeholder?: string;
  description?: string;
} & Omit<ComponentProps<typeof Input>, 'name' | 'placeholder'> &
  JSX.IntrinsicAttributes;

export function InputFormField<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = string,
  TStrict extends boolean = false,
>(
  props: FieldSelectorProps<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  > &
    InputFormFieldOwnProps,
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
          value={field.value ?? ''}
          onChange={field.onChange}
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

export function createInputFormField<TSchema extends z.ZodType>(
  factoryProps: SchemaProps<TSchema> & JSX.IntrinsicAttributes,
) {
  return function BoundInputFormField<
    TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    > = never,
    TFilterType = string,
    TStrict extends boolean = false,
  >(
    props: NameAndDiscriminatorProps<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    > &
      InputFormFieldOwnProps,
  ) {
    return <InputFormField {...factoryProps} {...props} />;
  };
}
