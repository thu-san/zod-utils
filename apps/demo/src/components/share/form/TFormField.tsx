import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelectorProps,
  NameAndDiscriminatorProps,
  SchemaProps,
} from '@zod-utils/core';
import {
  extractFieldFromSchema,
  requiresValidInput,
} from '@zod-utils/react-hook-form';
import type { JSX, ReactElement } from 'react';
import { type ControllerRenderProps, useFormContext } from 'react-hook-form';
import type z from 'zod';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useFieldLabel } from './TFormLabel';

export function TFormField<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = unknown,
  TStrict extends boolean = true,
>(
  props: FieldSelectorProps<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  > & {
    render: (field: {
      field: ControllerRenderProps;
      label: string;
    }) => ReactElement;
    description?: string;
  },
) {
  const { control } = useFormContext();

  const label = useFieldLabel(props);
  const field = extractFieldFromSchema(props);
  const isRequired = field ? requiresValidInput(field) : false;

  return (
    <FormField
      control={control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>{props.render({ field, label })}</FormControl>
          {props.description && (
            <FormDescription>{props.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function createTFormField<TSchema extends z.ZodType>(
  factoryProps: SchemaProps<TSchema> & JSX.IntrinsicAttributes,
) {
  return function BoundTFormField<
    TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    > = never,
    TFilterType = unknown,
    TStrict extends boolean = true,
  >(
    props: NameAndDiscriminatorProps<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    > & {
      render: (field: {
        field: ControllerRenderProps;
        label: string;
      }) => ReactElement;
      description?: string;
    },
  ) {
    return <TFormField {...factoryProps} {...props} />;
  };
}
