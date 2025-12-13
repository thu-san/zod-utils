import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FormFieldSelector,
  InferredFieldValues,
  ValidFieldPaths,
} from '@zod-utils/react-hook-form';
import type { ComponentProps } from 'react';
import type z from 'zod';
import { Input } from '@/components/ui/input';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import { TFormField } from './TFormField';

export function InputFormField<
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
    autoPlaceholder?: boolean;
    placeholder?: string;
    description?: string;
  } & Omit<ComponentProps<typeof Input>, 'name' | 'placeholder'>,
) {
  const {
    schema,
    name,
    autoPlaceholder,
    placeholder,
    description,
    discriminator,
    ...inputProps
  } = allProps;

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
      label,
    }: {
      field: {
        value: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onBlur: () => void;
        name: string;
        ref: React.Ref<HTMLInputElement>;
      };
      label: string;
    }) => (
      <Input
        {...inputProps}
        value={field.value ?? ''}
        onChange={field.onChange}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}
        placeholder={
          placeholder ||
          (autoPlaceholder ? `Please enter ${label.toLowerCase()}` : undefined)
        }
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

export function createInputFormField<TSchema extends z.ZodType>(factoryProps: {
  schema: TSchema;
}) {
  return function BoundInputFormField<
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
        typeof InputFormField<
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
      typeof InputFormField<
        TSchema,
        TPath,
        TDiscriminatorKey,
        TDiscriminatorValue,
        TFieldValues,
        TFilterType,
        TStrict
      >
    >[0];

    return InputFormField<
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
