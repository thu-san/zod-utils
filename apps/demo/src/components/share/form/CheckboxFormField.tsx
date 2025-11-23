import type { ComponentProps } from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import type { FormNamespace } from '@/types/i18n';
import {
  type DiscriminatorValue,
  TFormField,
  type ValidFieldName,
} from './TFormField';

export function CheckboxFormField<
  TFieldValues extends FieldValues,
  TNamespace extends FormNamespace,
  TName extends ValidFieldName<
    TFieldValues,
    TNamespace,
    TDiscriminatorField,
    TDiscriminatorValue
  >,
  TDiscriminatorField extends keyof TFieldValues,
  TDiscriminatorValue extends DiscriminatorValue<
    TFieldValues,
    TDiscriminatorField
  >,
>({
  control,
  name,
  namespace,
  description,
  discriminatorField,
  discriminatorValue,
  ...inputProps
}: {
  control: Control<TFieldValues>;
  name: TName;
  namespace: TNamespace;
  description?: string;
  discriminatorField?: TDiscriminatorField;
  discriminatorValue?: TDiscriminatorValue;
} & Omit<ComponentProps<'input'>, 'name' | 'type' | 'checked' | 'value'>) {
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
      render={({ field }) => (
        <input
          {...field}
          {...inputProps}
          type="checkbox"
          checked={field.value ?? false}
          value={undefined}
        />
      )}
    />
  );
}

export function createCheckboxFormField<
  TNamespace extends FormNamespace,
>(factoryProps: { namespace: TNamespace }) {
  return function BoundCheckboxFormField<
    TFieldValues extends FieldValues,
    TName extends ValidFieldName<
      TFieldValues,
      TNamespace,
      TDiscriminatorField,
      TDiscriminatorValue
    >,
    TDiscriminatorField extends keyof TFieldValues,
    TDiscriminatorValue extends DiscriminatorValue<
      TFieldValues,
      TDiscriminatorField
    >,
  >(
    props: Omit<
      React.ComponentProps<
        typeof CheckboxFormField<
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
    return (
      <CheckboxFormField<
        TFieldValues,
        TNamespace,
        TName,
        TDiscriminatorField,
        TDiscriminatorValue
      >
        {...factoryProps}
        {...props}
      />
    );
  };
}
