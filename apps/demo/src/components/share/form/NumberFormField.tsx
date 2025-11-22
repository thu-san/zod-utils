import type { ComponentProps } from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import type { FormNamespace } from '@/types/i18n';
import {
  type DiscriminatorValue,
  TFormField,
  type ValidFieldName,
} from './TFormField';

export function NumberFormField<
  TFieldValues extends FieldValues,
  TNamespace extends FormNamespace,
  TName extends ValidFieldName<
    TFieldValues,
    TNamespace,
    TDiscriminatorField,
    TDiscriminatorValue
  >,
  TDiscriminatorField extends keyof TFieldValues | undefined,
  TDiscriminatorValue extends DiscriminatorValue<
    TFieldValues,
    TDiscriminatorField
  >,
>({
  control,
  name,
  namespace,
  autoPlaceholder,
  placeholder,
  description,
  discriminatorField,
  discriminatorValue,
  ...inputProps
}: {
  control: Control<TFieldValues>;
  name: TName;
  namespace: TNamespace;
  autoPlaceholder?: boolean;
  placeholder?: string;
  description?: string;
  discriminatorField?: TDiscriminatorField;
  discriminatorValue?: TDiscriminatorValue;
} & Omit<
  ComponentProps<typeof Input>,
  'name' | 'placeholder' | 'type' | 'onChange'
>) {
  // Auto-generate validation description if not provided
  const autoDescription = useValidationDescription(name);
  const finalDescription =
    description !== undefined ? description : autoDescription;

  return (
    <TFormField
      control={control}
      name={name}
      namespace={namespace}
      description={finalDescription}
      discriminatorField={discriminatorField}
      discriminatorValue={discriminatorValue}
      render={({ field, label }) => (
        <Input
          {...inputProps}
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
            placeholder ||
            (autoPlaceholder
              ? `Please enter ${label.toLowerCase()}`
              : undefined)
          }
        />
      )}
    />
  );
}

export function createNumberFormField<
  TNamespace extends FormNamespace,
>(factoryProps: { namespace: TNamespace }) {
  return function BoundNumberFormField<
    TFieldValues extends FieldValues,
    TName extends ValidFieldName<
      TFieldValues,
      TNamespace,
      TDiscriminatorField,
      TDiscriminatorValue
    >,
    TDiscriminatorField extends keyof TFieldValues | undefined,
    TDiscriminatorValue extends DiscriminatorValue<
      TFieldValues,
      TDiscriminatorField
    >,
  >(
    props: Omit<
      React.ComponentProps<
        typeof NumberFormField<
          TFieldValues,
          TNamespace,
          TName,
          TDiscriminatorField,
          TDiscriminatorValue
        >
      >,
      'namespace'
    >,
  ) {
    return <NumberFormField {...factoryProps} {...props} />;
  };
}
