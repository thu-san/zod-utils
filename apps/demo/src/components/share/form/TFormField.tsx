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

export function TFormField<
  TFieldValues extends FieldValues,
  TNamespace extends FormNamespace,
  TName extends Extract<
    FieldPath<TFieldValues>,
    translationKeys<`${TNamespace}.form`>
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

export function createTFormField<TNamespace extends FormNamespace>(
  namespace: TNamespace,
) {
  return function BoundTFormField<
    TFieldValues extends FieldValues,
    TName extends Extract<
      FieldPath<TFieldValues>,
      translationKeys<`${TNamespace}.form`>
    >,
  >({
    control,
    name,
    render,
    description,
  }: {
    control: Control<TFieldValues>;
    name: TName;
    render: (field: {
      field: ControllerRenderProps<TFieldValues, TName>;
      label: string;
    }) => ReactElement;
    description?: string;
  }) {
    return (
      <TFormField
        control={control}
        name={name}
        namespace={namespace}
        render={render}
        description={description}
      />
    );
  };
}
