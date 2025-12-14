import {
  type DiscriminatorKey,
  type DiscriminatorValue,
  type FormFieldSelector,
  type InferredFieldValues,
  mergeFormFieldSelectorProps,
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
    description?: string;
  } & Omit<ComponentProps<'input'>, 'name' | 'type' | 'checked' | 'value'>,
) {
  const { description, ...inputProps } = props;

  // Auto-generate validation description if not provided
  const autoDescription = useValidationDescription<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >(props);

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
    ...props,
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
        typeof CheckboxFormField<
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
    const selectorProps = mergeFormFieldSelectorProps<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues
    >(factoryProps, { name, discriminator });

    return CheckboxFormField<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues
    >({ ...selectorProps, ...rest });
  };
}
