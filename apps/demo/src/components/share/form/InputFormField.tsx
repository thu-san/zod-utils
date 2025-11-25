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

export function InputFormField<
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
} & Omit<ComponentProps<typeof Input>, 'name' | 'placeholder'>) {
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
  TSchema extends ZodFormSchema,
  TNamespace extends FormNamespace,
>(factoryProps: { schema: TSchema; namespace: TNamespace }) {
  return function BoundInputFormField<
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
        typeof InputFormField<
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
      <InputFormField<
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
