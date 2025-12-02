import type {
  Discriminator,
  DiscriminatorKey,
  DiscriminatorValue,
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
    TFieldValues
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  const TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  >,
  TFieldValues extends InferredFieldValues<TSchema>,
>({
  schema,
  name,
  description,
  discriminator,
  ...inputProps
}: {
  schema: TSchema;
  name: TPath;
  description?: string;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
} & Omit<ComponentProps<'input'>, 'name' | 'type' | 'checked' | 'value'>) {
  // Auto-generate validation description if not provided
  const autoDescription = useValidationDescription({
    schema,
    name,
    discriminator,
  });
  const finalDescription =
    description !== undefined ? description : autoDescription;

  return (
    <TFormField<
      TSchema,
      TPath,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFieldValues
    >
      schema={schema}
      name={name}
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
    return (
      <CheckboxFormField<
        TSchema,
        TPath,
        TDiscriminatorKey,
        TDiscriminatorValue,
        TFieldValues
      >
        {...factoryProps}
        {...props}
      />
    );
  };
}
