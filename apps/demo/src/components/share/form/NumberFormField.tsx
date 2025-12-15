import {
  type DiscriminatorKey,
  type DiscriminatorValue,
  type FormFieldSelector,
  type InferredFieldValues,
  toFormFieldSelector,
  type ValidFieldPaths,
} from '@zod-utils/react-hook-form';
import type { ComponentProps } from 'react';
import type z from 'zod';
import { Input } from '@/components/ui/input';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import { TFormField } from './TFormField';

export function NumberFormField<
  TSchema extends z.ZodType,
  TPath extends ValidFieldPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  const TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  >,
  TFieldValues extends InferredFieldValues<TSchema>,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(
  props: FormFieldSelector<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  > & {
    autoPlaceholder?: boolean;
    placeholder?: string;
    description?: string;
  } & Omit<
      ComponentProps<typeof Input>,
      'name' | 'placeholder' | 'type' | 'onChange'
    >,
) {
  const {
    autoPlaceholder,
    placeholder,
    description,
    schema: _schema,
    name: _name,
    discriminator: _discriminator,
    ...inputProps
  } = props;

  const selectorProps = toFormFieldSelector<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  >(props);

  // Auto-generate validation description if not provided
  const autoDescription = useValidationDescription<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >(selectorProps);

  const finalDescription =
    description !== undefined ? description : autoDescription;

  return TFormField<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  >({
    ...selectorProps,
    description: finalDescription,
    render: ({ field, label }) => (
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
          (autoPlaceholder ? `Please enter ${label.toLowerCase()}` : undefined)
        }
      />
    ),
  });
}

export function createNumberFormField<TSchema extends z.ZodType>(factoryProps: {
  schema: TSchema;
}) {
  return function BoundNumberFormField<
    TPath extends ValidFieldPaths<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues
    >,
    TDiscriminatorKey extends DiscriminatorKey<TSchema>,
    const TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    >,
    TFieldValues extends InferredFieldValues<TSchema>,
  >(
    props: Omit<
      React.ComponentProps<
        typeof NumberFormField<
          TSchema,
          TPath,
          TDiscriminatorKey,
          TDiscriminatorValue,
          TFieldValues
        >
      >,
      'schema'
    >,
  ) {
    const { name, discriminator, ...rest } = props;
    const selectorProps = toFormFieldSelector<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues
    >({ ...factoryProps, name, discriminator });

    return NumberFormField<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues
    >({ ...selectorProps, ...rest });
  };
}
