import type {
  ValidFieldName as BaseValidFieldName,
  Discriminator,
  DiscriminatorKey,
  DiscriminatorValue,
  InferredFieldValues,
} from '@zod-utils/react-hook-form';
import { useTranslations } from 'next-intl';
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
import type {
  FormNamespace,
  FormTranslationKey,
  translationKeys,
} from '@/types/i18n';
import { TFormLabel } from './TFormLabel';

/**
 * Type-safe field names for a specific discriminator value with i18n constraint.
 *
 * Extends the base ValidFieldName from @zod-utils/react-hook-form with
 * translation key constraint for this demo app.
 */
export type ValidFieldName<
  TSchema extends z.ZodType,
  TNamespace extends FormNamespace,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
  TFieldValues extends InferredFieldValues<TSchema>,
> = BaseValidFieldName<
  TSchema,
  TDiscriminatorKey,
  TDiscriminatorValue,
  TFieldValues
> &
  translationKeys<`${TNamespace}.form`>;

export function TFormField<
  TSchema extends z.ZodType,
  TNamespace extends FormNamespace,
  TName extends ValidFieldName<
    TSchema,
    TNamespace,
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
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
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
            TDiscriminatorKey,
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
          TNamespace,
          TName,
          TDiscriminatorKey,
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
