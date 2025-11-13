import type { ComponentProps } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useValidationDescription } from '@/hooks/useValidationDescription';
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
  // Auto-generate validation description if not provided
  const autoDescription = useValidationDescription(name);
  const finalDescription =
    description !== undefined ? description : autoDescription;

  return (
    <TFormField
      control={control}
      name={name}
      namespace={namespace}
      description={finalDescription}
      render={({ field, label }) => (
        <Input
          {...inputProps}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          placeholder={
            placeholder ||
            (autoPlaceholder
              ? `Please enter ${label.toLowerCase()}`
              : undefined)
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
