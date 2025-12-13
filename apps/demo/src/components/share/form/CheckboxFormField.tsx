import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FormFieldSelector,
  InferredFieldValues,
  ValidFieldPaths,
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
  TFieldValues extends
    InferredFieldValues<TSchema> = InferredFieldValues<TSchema>,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(
  allProps: FormFieldSelector<
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
  const { schema, name, description, discriminator, ...inputProps } = allProps;

  // Auto-generate validation description if not provided
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const autoDescription = useValidationDescription({
    schema,
    name,
    discriminator,
  } as unknown as Parameters<typeof useValidationDescription>[0]);
  const finalDescription =
    description !== undefined ? description : autoDescription;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const formFieldProps = {
    ...allProps,
    description: finalDescription,
    render: ({
      field,
    }: {
      field: { value: boolean; onChange: (value: boolean) => void };
    }) => (
      <input
        {...inputProps}
        type="checkbox"
        checked={field.value ?? false}
        onChange={(e) => field.onChange(e.target.checked)}
        value={undefined}
      />
    ),
  } as React.ComponentProps<
    typeof TFormField<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues,
      TFilterType,
      TStrict
    >
  >;

  return TFormField<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  >(formFieldProps);
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
    TFieldValues extends
      InferredFieldValues<TSchema> = InferredFieldValues<TSchema>,
    TFilterType = unknown,
    TStrict extends boolean = true,
  >(
    props: Omit<
      Parameters<
        typeof CheckboxFormField<
          TSchema,
          TPath,
          TDiscriminatorKey,
          TDiscriminatorValue,
          TFieldValues,
          TFilterType,
          TStrict
        >
      >[0],
      'schema'
    >,
  ) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mergedProps = {
      ...factoryProps,
      ...props,
    } as Parameters<
      typeof CheckboxFormField<
        TSchema,
        TPath,
        TDiscriminatorKey,
        TDiscriminatorValue,
        TFieldValues,
        TFilterType,
        TStrict
      >
    >[0];

    return CheckboxFormField<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues,
      TFilterType,
      TStrict
    >(mergedProps);
  };
}
