import type {
  Discriminator,
  DiscriminatorKey,
  DiscriminatorValue,
  InferredFieldValues,
  ValidFieldPaths,
} from '@zod-utils/react-hook-form';
import type { ComponentProps } from 'react';
import type z from 'zod';
import { Input } from '@/components/ui/input';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import { TFormField } from './TFormField';

export type CommonFields<T> = Pick<T, keyof T>;

export function InputFormField<
  TSchema extends z.ZodType,
  TPath extends ValidFieldPaths<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues
  >,
  const TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  const TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  >,
  TFieldValues extends InferredFieldValues<TSchema>,
>({
  schema,
  name,
  autoPlaceholder,
  placeholder,
  description,
  discriminator,
  ...inputProps
}: {
  schema: TSchema;
  name: TPath;
  autoPlaceholder?: boolean;
  placeholder?: string;
  description?: string;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
} & Omit<ComponentProps<typeof Input>, 'name' | 'placeholder'>) {
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

export function createInputFormField<TSchema extends z.ZodType>(factoryProps: {
  schema: TSchema;
}) {
  return function BoundInputFormField<
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
        typeof InputFormField<
          TSchema,
          TPath,
          TDiscriminatorKey,
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
