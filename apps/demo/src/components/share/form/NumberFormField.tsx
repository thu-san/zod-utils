import type { ComponentProps } from 'react';
import type { Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
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

export function NumberFormField<
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
  autoPlaceholder,
  placeholder,
  description,
  discriminator,
  ...inputProps
}: {
  schema: TSchema;
  name: TName;
  namespace: TNamespace;
  autoPlaceholder?: boolean;
  placeholder?: string;
  description?: string;
  discriminator?: {
    key: TDiscriminatorField;
    value: TDiscriminatorValue;
  };
} & Omit<
  ComponentProps<typeof Input>,
  'name' | 'placeholder' | 'type' | 'onChange'
>) {
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
  TSchema extends ZodFormSchema,
  TNamespace extends FormNamespace,
>(factoryProps: { schema: TSchema; namespace: TNamespace }) {
  return function BoundNumberFormField<
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
        typeof NumberFormField<
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
      <NumberFormField<
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
