import {
  type Discriminator,
  type DiscriminatorKey,
  type DiscriminatorValue,
  type InferredFieldValues,
  useIsRequiredField,
} from '@zod-utils/react-hook-form';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import type z from 'zod';
import { FormLabel } from '@/components/ui/form';
import type {
  FormNamespace,
  FormTranslationKey,
  translationKeys,
} from '@/types/i18n';
import type { ValidFieldName } from './TFormField';

export function TFormLabel<
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
  schema,
  name,
  namespace,
  discriminator,
  ...props
}: Omit<ComponentProps<typeof FormLabel>, 'children'> & {
  schema: TSchema;
  name: TName;
  namespace: TNamespace;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
}) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const t = useTranslations(namespace as FormNamespace);

  const value = t(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    `form.${name as translationKeys<FormTranslationKey>}`,
  );

  const isRequired = useIsRequiredField({
    schema,
    fieldName: name,
    discriminator,
  });

  return (
    <FormLabel {...props}>
      {value}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </FormLabel>
  );
}

export function createTFormLabel<
  TSchema extends z.ZodType,
  TNamespace extends FormNamespace,
>(factoryProps: { schema: TSchema; namespace: TNamespace }) {
  return function BoundTFormLabel<
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
        typeof TFormLabel<
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
    return (
      <TFormLabel<
        TSchema,
        TNamespace,
        TName,
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
