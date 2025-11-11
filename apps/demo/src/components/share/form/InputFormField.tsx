import type { ComponentProps } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import type { FormNamespace, translationKeys } from '@/types/i18n';
import { TFormField } from './TFormField';

export function InputFormField<
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
  autoPlaceholder,
  placeholder,
  description,
  ...inputProps
}: {
  control: Control<TFieldValues>;
  name: TName;
  namespace: TNamespace;
  autoPlaceholder?: boolean;
  placeholder?: string;
  description?: string;
} & Omit<ComponentProps<typeof Input>, 'name' | 'placeholder'>) {
  return (
    <TFormField
      control={control}
      name={name}
      namespace={namespace}
      description={description}
      render={({ field, label }) => (
        <Input
          {...field}
          {...inputProps}
          placeholder={
            placeholder ||
            (autoPlaceholder ? `Please enter ${label.toLowerCase()}` : undefined)
          }
        />
      )}
    />
  );
}

export function createInputFormField<TNamespace extends FormNamespace>(
  namespace: TNamespace,
) {
  return function BoundInputFormField<
    TFieldValues extends FieldValues,
    TName extends Extract<
      FieldPath<TFieldValues>,
      translationKeys<`${TNamespace}.form`>
    >,
  >({
    control,
    name,
    autoPlaceholder,
    placeholder,
    description,
    ...inputProps
  }: {
    control: Control<TFieldValues>;
    name: TName;
    autoPlaceholder?: boolean;
    placeholder?: string;
    description?: string;
  } & Omit<ComponentProps<typeof Input>, 'name' | 'placeholder'>) {
    return (
      <InputFormField
        control={control}
        name={name}
        namespace={namespace}
        autoPlaceholder={autoPlaceholder}
        placeholder={placeholder}
        description={description}
        {...inputProps}
      />
    );
  };
}
