import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelectorProps,
  NameAndDiscriminatorProps,
  SchemaProps,
} from '@zod-utils/core';
import type { ComponentProps, JSX } from 'react';
import type z from 'zod';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import { TFormField } from './TFormField';

type CheckboxFormFieldOwnProps = {
  description?: string;
} & Omit<ComponentProps<'input'>, 'name' | 'type' | 'checked' | 'value'> &
  JSX.IntrinsicAttributes;

export function CheckboxFormField<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = boolean,
  TStrict extends boolean = false,
>(
  props: FieldSelectorProps<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  > &
    CheckboxFormFieldOwnProps,
) {
  // Auto-generate validation description if not provided
  const autoDescription = useValidationDescription(props);

  const finalDescription =
    props.description !== undefined ? props.description : autoDescription;

  return (
    <TFormField
      {...props}
      description={finalDescription}
      render={({ field }) => (
        <input
          type="checkbox"
          checked={field.value ?? false}
          onChange={(e) => field.onChange(e.target.checked)}
          value={undefined}
        />
      )}
    />
  );
}

export function createCheckboxFormField<TSchema extends z.ZodType>(
  factoryProps: SchemaProps<TSchema> & JSX.IntrinsicAttributes,
) {
  return function BoundCheckboxFormField<
    TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    > = never,
    TFilterType = boolean,
    TStrict extends boolean = false,
  >(
    props: NameAndDiscriminatorProps<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    > &
      CheckboxFormFieldOwnProps,
  ) {
    return <CheckboxFormField {...factoryProps} {...props} />;
  };
}
