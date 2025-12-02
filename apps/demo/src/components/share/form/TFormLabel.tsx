import {
  type Discriminator,
  type DiscriminatorKey,
  type DiscriminatorValue,
  type InferredFieldValues,
  useExtractFieldFromSchema,
  useIsRequiredField,
  type ValidFieldPaths,
  type ValidPaths,
} from '@zod-utils/react-hook-form';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import type z from 'zod';
import { FormLabel } from '@/components/ui/form';

export const useFieldLabel = <
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  const TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  >,
>({
  schema,
  name,
  discriminator,
}: {
  schema: TSchema;
  name: TPath;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
}) => {
  const field = useExtractFieldFromSchema({
    schema,
    name,
    discriminator,
  });

  const t = useTranslations();
  const translationKey = field?.meta()?.translationKey;
  const value = translationKey ? t(translationKey) : 'This field';

  return value;
};

export function TFormLabel<
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
  schema,
  name,
  discriminator,
  ...props
}: Omit<ComponentProps<typeof FormLabel>, 'children'> & {
  schema: TSchema;
  name: TPath;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
}) {
  const label = useFieldLabel({
    schema,
    name,
    discriminator,
  });

  const isRequired = useIsRequiredField({
    schema,
    name,
    discriminator,
  });

  return (
    <FormLabel {...props}>
      {label}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </FormLabel>
  );
}

export function createTFormLabel<TSchema extends z.ZodType>(factoryProps: {
  schema: TSchema;
}) {
  return function BoundTFormLabel<
    TName extends ValidFieldPaths<
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
        typeof TFormLabel<
          TSchema,
          TName,
          TDiscriminatorKey,
          TDiscriminatorValue,
          TFieldValues
        >
      >,
      'schema'
    >,
  ) {
    return (
      <TFormLabel<
        TSchema,
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
