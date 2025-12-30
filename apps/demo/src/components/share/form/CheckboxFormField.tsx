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
import { useValidationDescription } from '@/hooks/useValidationDescription';
import { TFormField } from './TFormField';

export function CheckboxFormField<
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
  TFilterType = boolean,
  TStrict extends boolean = false,
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
    description?: string;
  } & Omit<ComponentProps<'input'>, 'name' | 'type' | 'checked' | 'value'>,
) {
  const {
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
    render: ({ field }) => (
      <input
        {...inputProps}
        type="checkbox"
        checked={field.value ?? false}
        onChange={(e) => field.onChange(e.target.checked)}
        value={undefined}
      />
    ),
  });
}

export function createCheckboxFormField<
  TSchema extends z.ZodType,
>(factoryProps: { schema: TSchema }) {
  return function BoundCheckboxFormField<
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
    TFilterType = boolean,
    TStrict extends boolean = false,
  >(
    props: Omit<
      React.ComponentProps<
        typeof CheckboxFormField<
          TSchema,
          TPath,
          TDiscriminatorKey,
          TDiscriminatorValue,
          TFieldValues,
          TFilterType,
          TStrict
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
      TFieldValues,
      TFilterType,
      TStrict
    >({ ...factoryProps, name, discriminator });

    return CheckboxFormField<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues,
      TFilterType,
      TStrict
    >({ ...selectorProps, ...rest });
  };
}
