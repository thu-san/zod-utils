import type { ComponentProps } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import type { FormNamespace, translationKeys } from '@/types/i18n';
import { TFormLabel } from './TFormLabel';

export function CheckboxFormField<
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
  description,
  ...inputProps
}: {
  control: Control<TFieldValues>;
  name: TName;
  namespace: TNamespace;
  description?: string;
} & Omit<ComponentProps<'input'>, 'name' | 'type' | 'checked' | 'value'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <FormControl>
              <input
                {...field}
                {...inputProps}
                type="checkbox"
                checked={field.value ?? false}
                value={undefined}
              />
            </FormControl>
            <TFormLabel namespace={namespace} name={name} className="mt-0!" />
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function createCheckboxFormField<TNamespace extends FormNamespace>(
  namespace: TNamespace,
) {
  return function BoundCheckboxFormField<
    TFieldValues extends FieldValues,
    TName extends Extract<
      FieldPath<TFieldValues>,
      translationKeys<`${TNamespace}.form`>
    >,
  >({
    control,
    name,
    description,
    ...inputProps
  }: {
    control: Control<TFieldValues>;
    name: TName;
    description?: string;
  } & Omit<ComponentProps<'input'>, 'name' | 'type' | 'checked' | 'value'>) {
    return (
      <CheckboxFormField
        control={control}
        name={name}
        namespace={namespace}
        description={description}
        {...inputProps}
      />
    );
  };
}
