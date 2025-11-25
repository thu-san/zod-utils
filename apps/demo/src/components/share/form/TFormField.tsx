import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';
import {
  type ControllerRenderProps,
  type FieldValues,
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
import type {
  FormNamespace,
  FormTranslationKey,
  translationKeys,
} from '@/types/i18n';
import { TFormLabel } from './TFormLabel';

export type DiscriminatorField<TSchema extends z.ZodType> =
  keyof z.input<TSchema>;

export type InferredFieldValues<TSchema extends z.ZodType> = z.input<TSchema> &
  FieldValues;

export type DiscriminatorValue<
  TSchema extends z.ZodType,
  TDiscriminatorField extends DiscriminatorField<TSchema>,
> = TDiscriminatorField extends string
  ? z.input<TSchema>[TDiscriminatorField]
  : never;

export type ValidFieldName<
  TSchema extends z.ZodType,
  TNamespace extends FormNamespace,
  TDiscriminatorField extends DiscriminatorField<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorField>,
  TFieldValues extends InferredFieldValues<TSchema>,
> = keyof Extract<
  Required<z.input<TSchema>>,
  Record<TDiscriminatorField, TDiscriminatorValue>
> &
  translationKeys<`${TNamespace}.form`> &
  Path<TFieldValues>;

export function TFormField<
  TSchema extends z.ZodType,
  TNamespace extends FormNamespace,
  TName extends ValidFieldName<
    TSchema,
    TNamespace,
    TDiscriminatorField,
    TDiscriminatorValue,
    TFieldValues
  >,
  TDiscriminatorField extends DiscriminatorField<TSchema>,
  const TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorField
  >,
  TFieldValues extends InferredFieldValues<TSchema>,
>({
  name,
  namespace,
  render,
  description,
  ...props
}: {
  // The `schema` prop is used for type inference and is also passed to child components (e.g., TFormLabel). It is not used for runtime logic in this component.
  schema: TSchema;
  name: TName;
  namespace: TNamespace;
  render: (field: {
    field: ControllerRenderProps<TFieldValues, TName>;
    label: string;
  }) => ReactElement;
  description?: string;
  // The `discriminator` prop is used for type inference and is also passed to child components (e.g., TFormLabel). It is not used for runtime logic in this component.
  discriminator?: {
    key: TDiscriminatorField;
    value: TDiscriminatorValue;
  };
}) {
  const { control } = useFormContext<TFieldValues>();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const t = useTranslations(namespace as FormNamespace);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const label = t(`form.${name as translationKeys<FormTranslationKey>}`);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <TFormLabel<
            TSchema,
            TNamespace,
            TName,
            TDiscriminatorField,
            TDiscriminatorValue,
            TFieldValues
          >
            namespace={namespace}
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

export function createTFormField<
  TSchema extends z.ZodType,
  TNamespace extends FormNamespace,
>(factoryProps: { schema: TSchema; namespace: TNamespace }) {
  return function BoundTFormField<
    TName extends ValidFieldName<
      TSchema,
      TNamespace,
      TDiscriminatorField,
      TDiscriminatorValue,
      TFieldValues
    >,
    TDiscriminatorField extends DiscriminatorField<TSchema>,
    const TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorField
    >,
    TFieldValues extends InferredFieldValues<TSchema>,
  >(
    props: Omit<
      React.ComponentProps<
        typeof TFormField<
          TSchema,
          TNamespace,
          TName,
          TDiscriminatorField,
          TDiscriminatorValue,
          TFieldValues
        >
      >,
      'namespace' | 'schema'
    >,
  ) {
    return <TFormField {...factoryProps} {...props} />;
  };
}
