import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FormFieldSelector,
  InferredFieldValues,
  ValidFieldPaths,
} from '@zod-utils/react-hook-form';
import type { ReactElement } from 'react';
import {
  type ControllerRenderProps,
  type Path,
  useFormContext,
} from 'react-hook-form';
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
    render: (field: {
      field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
      label: string;
    }) => ReactElement;
    description?: string;
  },
) {
  const { control } = useFormContext<TFieldValues>();
  const label = useFieldLabel<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >(props);

  const { name, render, description } = props;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <TFormLabel
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            {...(props as React.ComponentProps<
              typeof TFormLabel<
                TSchema,
                TPath,
                TDiscriminatorKey,
                TDiscriminatorValue,
                TFilterType,
                TStrict
              >
            >)}
          />
          <FormControl>
            {render({
              field,
              label,
            })}
          </FormControl>
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
    props: Omit<
      React.ComponentProps<
        typeof TFormField<
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mergedProps = {
      ...factoryProps,
      ...props,
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
    >(mergedProps);
  };
}
