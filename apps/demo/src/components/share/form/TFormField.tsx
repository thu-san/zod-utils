import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';
import type {
  Control,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import type { FormNamespace, translationKeys } from '@/types/i18n';
import { TFormLabel } from './TFormLabel';

export type DiscriminatorValue<
  TFieldValues extends FieldValues,
  TDiscriminatorField extends keyof TFieldValues,
> = TDiscriminatorField extends string
  ? TFieldValues[TDiscriminatorField]
  : never;

// Helper type for valid field names with discriminator support
export type ValidFieldName<
  TFieldValues extends FieldValues,
  TNamespace extends FormNamespace,
  TDiscriminatorField extends keyof TFieldValues,
  TDiscriminatorValue extends DiscriminatorValue<
    TFieldValues,
    TDiscriminatorField
  >,
> = Extract<
  ExtractDiscriminatedFields<
    TFieldValues,
    TDiscriminatorField,
    TDiscriminatorValue
  >,
  translationKeys<`${TNamespace}.form`>
>;

export type ExtractDiscriminatedFields<
  TFieldValues extends FieldValues,
  TDiscriminatorField extends keyof TFieldValues,
  TDiscriminatorValue extends DiscriminatorValue<
    TFieldValues,
    TDiscriminatorField
  >,
  TDiscriminatedFields extends keyof Extract<
    Required<TFieldValues>,
    Record<TDiscriminatorField, TDiscriminatorValue>
  > = keyof Extract<
    Required<TFieldValues>,
    Record<TDiscriminatorField, TDiscriminatorValue>
  >,
> = TDiscriminatedFields extends FieldPath<TFieldValues>
  ? TDiscriminatedFields
  : never;

export function TFormField<
  TFieldValues extends FieldValues,
  TNamespace extends FormNamespace,
  TName extends ValidFieldName<
    TFieldValues,
    TNamespace,
    TDiscriminatorField,
    TDiscriminatorValue
  >,
  TDiscriminatorField extends keyof TFieldValues,
  TDiscriminatorValue extends DiscriminatorValue<
    TFieldValues,
    TDiscriminatorField
  >,
>({
  control,
  name,
  namespace,
  render,
  description,
}: {
  control: Control<TFieldValues>;
  name: TName;
  namespace: TNamespace;
  render: (field: {
    field: ControllerRenderProps<TFieldValues, TName>;
    label: string;
  }) => ReactElement;
  description?: string;
  discriminator?: {
    key: TDiscriminatorField;
    value: TDiscriminatorValue;
  }; // used only for type inference
}) {
  const t = useTranslations(namespace);
  // @ts-expect-error - Generic field names can't be narrowed to form translation keys at compile-time
  const label = t(`form.${name}`);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <TFormLabel namespace={namespace} name={name} />
          <FormControl>{render({ field, label })}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function createTFormField<
  TFieldValues extends FieldValues,
  TNamespace extends FormNamespace,
  TDiscriminatorField extends keyof TFieldValues & string,
  TDiscriminatorValue extends
    TFieldValues[TDiscriminatorField] = TFieldValues[TDiscriminatorField],
>(factoryProps: {
  namespace: TNamespace;
  discriminator?: {
    key: TDiscriminatorField;
    value: TDiscriminatorValue;
  };
}) {
  return function BoundTFormField<
    TName extends Extract<
      ExtractDiscriminatedFields<
        TFieldValues,
        TDiscriminatorField,
        TDiscriminatorValue
      >,
      translationKeys<`${TNamespace}.form`>
    >,
  >(
    props: Omit<
      React.ComponentProps<
        typeof TFormField<
          TFieldValues,
          TNamespace,
          TName,
          TDiscriminatorField,
          TDiscriminatorValue
        >
      >,
      'namespace'
    >,
  ) {
    return (
      <TFormField<
        TFieldValues,
        TNamespace,
        TName,
        TDiscriminatorField,
        TDiscriminatorValue
      >
        {...factoryProps}
        {...props}
      />
    );
  };
}
