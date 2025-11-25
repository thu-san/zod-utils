import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import type { Path } from 'react-hook-form';
import { FormLabel } from '@/components/ui/form';
import { useIsFieldRequired } from '@/lib/form-schema-context';
import type {
  FormNamespace,
  FormTranslationKey,
  translationKeys,
} from '@/types/i18n';
import type {
  DiscriminatorField,
  DiscriminatorValue,
  InferredFieldValues,
  ValidFieldName,
  ZodFormSchema,
} from './TFormField';

export function TFormLabel<
  TSchema extends ZodFormSchema,
  TNamespace extends FormNamespace,
  TName extends Extract<
    ValidFieldName<
      TSchema,
      TNamespace,
      TDiscriminatorField,
      TDiscriminatorValue,
      TFieldValues
    >,
    Path<TFieldValues>
  >,
  TDiscriminatorField extends DiscriminatorField<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorField>,
  TFieldValues extends InferredFieldValues<TSchema>,
>({
  name,
  namespace,
  ...props
}: Omit<ComponentProps<typeof FormLabel>, 'children'> & {
  schema: TSchema;
  name: TName;
  namespace: TNamespace;
  discriminator?: {
    key: TDiscriminatorField;
    value: TDiscriminatorValue;
  };
}) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const t = useTranslations(namespace as FormNamespace);

  const value = t(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    `form.${name as translationKeys<FormTranslationKey>}`,
  );

  const isRequired = useIsFieldRequired(name);

  return (
    <FormLabel {...props}>
      {value}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </FormLabel>
  );
}

export function createTFormLabel<
  TSchema extends ZodFormSchema,
  TNamespace extends FormNamespace,
>(factoryProps: { schema: TSchema; namespace: TNamespace }) {
  return function BoundTFormLabel<
    TName extends Extract<
      ValidFieldName<
        TSchema,
        TNamespace,
        TDiscriminatorField,
        TDiscriminatorValue,
        TFieldValues
      >,
      Path<TFieldValues>
    >,
    TDiscriminatorField extends DiscriminatorField<TSchema>,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorField
    >,
    TFieldValues extends InferredFieldValues<TSchema>,
  >(
    props: Omit<
      React.ComponentProps<
        typeof TFormLabel<
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
    return (
      <TFormLabel<
        TSchema,
        TNamespace,
        TName,
        TDiscriminatorField,
        TDiscriminatorValue,
        TFieldValues
      >
        {...factoryProps}
        {...props}
      />
    );
  };
}
