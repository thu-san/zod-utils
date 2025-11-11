import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import { FormLabel } from '@/components/ui/form';
import { useIsFieldRequired } from '@/lib/form-schema-context';
import type {
  FormNamespace,
  FormTranslationKey,
  translationKeys,
} from '@/types/i18n';

export function TFormLabel<T extends FormNamespace>({
  namespace,
  name,
  ...props
}: Omit<ComponentProps<typeof FormLabel>, 'children'> & {
  namespace: T;
  name: translationKeys<`${T}.form`>;
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

export function createTFormLabel<T extends FormNamespace>(namespace: T) {
  return function BoundTFormLabel({
    name,
    ...props
  }: Omit<Parameters<typeof TFormLabel<T>>[0], 'namespace'>) {
    return <TFormLabel namespace={namespace} name={name} {...props} />;
  };
}
