import {
  type DiscriminatorKey,
  type DiscriminatorValue,
  type FormFieldSelector,
  type InferredFieldValues,
  toFormFieldSelector,
  type ValidFieldPaths,
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

  const selectorProps = toFormFieldSelector<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFieldValues,
    TFilterType,
    TStrict
  >(props);

  const label = useFieldLabel<
    TSchema,
    TPath,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >(selectorProps);

  return (
    <FormField
      control={control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <TFormLabel<
            TSchema,
            TPath,
            TDiscriminatorKey,
            TDiscriminatorValue,
            TFilterType,
            TStrict
          >
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            {...(selectorProps as React.ComponentProps<
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
            {props.render({
              field,
              label,
            })}
          </FormControl>
          {props.description && (
            <FormDescription>{props.description}</FormDescription>
          )}
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

    return TFormField<
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
