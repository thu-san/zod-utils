import type { ComponentProps } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useValidationDescription } from '@/hooks/useValidationDescription';
import type { FormNamespace, translationKeys } from '@/types/i18n';
import { TFormField } from './TFormField';

export function NumberFormField<
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
  nullable,
  ...inputProps
}: {
  control: Control<TFieldValues>;
  name: TName;
  namespace: TNamespace;
  autoPlaceholder?: boolean;
  placeholder?: string;
  description?: string;
  nullable?: boolean;
} & Omit<
  ComponentProps<typeof Input>,
  'name' | 'placeholder' | 'type' | 'onChange'
>) {
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
          {...field}
          {...inputProps}
          type="number"
          placeholder={
            placeholder ||
            (autoPlaceholder
              ? `Please enter ${label.toLowerCase()}`
              : undefined)
          }
          onChange={(e) => {
            if (nullable) {
              const val = e.target.value;
              field.onChange(val === '' ? undefined : Number(val));
            } else {
              field.onChange(e.target.valueAsNumber);
            }
          }}
        />
      )}
    />
  );
}

export function createNumberFormField<TNamespace extends FormNamespace>(
  namespace: TNamespace,
) {
  return function BoundNumberFormField<
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
    nullable,
    ...inputProps
  }: {
    control: Control<TFieldValues>;
    name: TName;
    autoPlaceholder?: boolean;
    placeholder?: string;
    description?: string;
    nullable?: boolean;
  } & Omit<
    ComponentProps<typeof Input>,
    'name' | 'placeholder' | 'type' | 'onChange'
  >) {
    return (
      <NumberFormField
        control={control}
        name={name}
        namespace={namespace}
        autoPlaceholder={autoPlaceholder}
        placeholder={placeholder}
        description={description}
        nullable={nullable}
        {...inputProps}
      />
    );
  };
}
