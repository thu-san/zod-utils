import type { ComponentProps } from 'react';
import type { Path } from 'react-hook-form';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import type { FormNamespace } from '@/types/i18n';
import {
  type DiscriminatorField,
  type DiscriminatorValue,
  type InferredFieldValues,
  TFormField,
  type ValidFieldName,
  type ZodFormSchema,
} from './TFormField';

export function CheckboxFormField<
  TSchema extends ZodFormSchema,
  TNamespace extends FormNamespace,
  TName extends Extract<
    ValidFieldName<
      TSchema,
      TNamespace,
      TDiscriminatorField,
      TDiscriminatorValue,
      TFieldValues
    >,
    Path<TFieldValues>
  >,
  TDiscriminatorField extends DiscriminatorField<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorField>,
  TFieldValues extends InferredFieldValues<TSchema>,
>({
  schema,
  name,
  namespace,
  description,
  discriminator,
  ...inputProps
}: {
  schema: TSchema;
  name: TName;
  namespace: TNamespace;
  description?: string;
  discriminator?: {
    key: TDiscriminatorField;
    value: TDiscriminatorValue;
  };
} & Omit<ComponentProps<'input'>, 'name' | 'type' | 'checked' | 'value'>) {
  // Auto-generate validation description if not provided
  const autoDescription = useValidationDescription(name);
  const finalDescription =
    description !== undefined ? description : autoDescription;

  return (
    <TFormField<
      TSchema,
      TNamespace,
      TName,
      TDiscriminatorField,
      TDiscriminatorValue,
      TFieldValues
    >
      schema={schema}
      name={name}
      namespace={namespace}
      description={finalDescription}
      discriminator={discriminator}
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
  TSchema extends ZodFormSchema,
  TNamespace extends FormNamespace,
>(factoryProps: { schema: TSchema; namespace: TNamespace }) {
  return function BoundCheckboxFormField<
    TName extends Extract<
      ValidFieldName<
        TSchema,
        TNamespace,
        TDiscriminatorField,
        TDiscriminatorValue,
        TFieldValues
      >,
      Path<TFieldValues>
    >,
    TDiscriminatorField extends DiscriminatorField<TSchema>,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorField
    >,
    TFieldValues extends InferredFieldValues<TSchema>,
  >(
    props: Omit<
      React.ComponentProps<
        typeof CheckboxFormField<
          TSchema,
          TNamespace,
          TName,
          TDiscriminatorField,
          TDiscriminatorValue,
          TFieldValues
        >
      >,
      'namespace' | 'schema'
    >,
  ) {
    return (
      <CheckboxFormField<
        TSchema,
        TNamespace,
        TName,
        TDiscriminatorField,
        TDiscriminatorValue,
        TFieldValues
      >
        {...factoryProps}
        {...props}
      />
    );
  };
}
