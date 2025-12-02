import type {
  Discriminator,
  DiscriminatorKey,
  DiscriminatorValue,
  InferredFieldValues,
  ValidFieldPaths,
} from '@zod-utils/react-hook-form';
import type { ReactElement } from 'react';
import { type ControllerRenderProps, useFormContext } from 'react-hook-form';
import type z from 'zod';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { TFormLabel, useFieldLabel } from './TFormLabel';

export function TFormField<
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
  name,
  render,
  description,
  ...props
}: {
  // The `schema` prop is used for type inference and is also passed to child components (e.g., TFormLabel). It is not used for runtime logic in this component.
  schema: TSchema;
  name: TPath;
  render: (field: {
    field: ControllerRenderProps<TFieldValues, TPath>;
    label: string;
  }) => ReactElement;
  description?: string;
  // The `discriminator` prop is used for type inference and is also passed to child components (e.g., TFormLabel). It is not used for runtime logic in this component.
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
}) {
  const { control } = useFormContext<TFieldValues>();
  const label = useFieldLabel({
    schema: props.schema,
    name,
    discriminator: props.discriminator,
  });

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <TFormLabel<
            TSchema,
            TPath,
            TDiscriminatorKey,
            TDiscriminatorValue,
            TFieldValues
          >
            name={name}
            {...props}
          />
          <FormControl>{render({ field, label })}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function createTFormField<TSchema extends z.ZodType>(factoryProps: {
  schema: TSchema;
}) {
  return function BoundTFormField<
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
        typeof TFormField<
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
    return <TFormField {...factoryProps} {...props} />;
  };
}
