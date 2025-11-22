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

export function InputFormField<
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
} & Omit<ComponentProps<typeof Input>, 'name' | 'placeholder'>) {
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
          value={field.value ?? ''}
          onChange={field.onChange}
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

export function createInputFormField<
  TNamespace extends FormNamespace,
>(factoryProps: { namespace: TNamespace }) {
  return function BoundInputFormField<
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
        typeof InputFormField<
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
      <InputFormField<
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
