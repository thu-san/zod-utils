import type { createTranslator, useTranslations } from 'next-intl';
import type { NamespaceMessages } from '@/i18n/request';

// Use NamespaceMessages as the Messages type
type Messages = NamespaceMessages;

export type TRANSLATION_NAMESPACE = keyof NamespaceMessages;

/**
 * Type representing all valid namespace keys that can be passed to `useTranslations()`
 *
 * @example
 * ```tsx
 * // Valid namespace keys (top-level or nested paths)
 * type Examples = useTranslationKeys;
 * // "user" | etc.
 *
 * // Usage in components
 * function MyComponent() {
 *   const namespace: useTranslationKeys = "user";
 *   const t = useTranslations(namespace);
 *   return <div>{t("some-key")}</div>;
 * }
 * ```
 */
export type useTranslationKeys = NonNullable<
  Parameters<typeof useTranslations>[0]
>;

export type translatorType<T extends useTranslationKeys = never> = ReturnType<
  typeof createTranslator<Messages, T>
>;

/**
 * Generic type that extracts all valid translation keys for a specific namespace path
 *
 * @example
 * ```tsx
 * // Get all valid keys within "user"
 * type UserKeys = translationKeys<"user">;
 * // "form.stringRequired" | "form.stringNullish" | "placeholders.arrayOfStringRequired" | etc.
 *
 * // Usage with dynamic namespace
 * type DynamicKeys<T extends useTranslationKeys> = translationKeys<T>;
 *
 * // Practical usage in component props
 * type FormFieldProps<T extends useTranslationKeys> = {
 *   namespace: T;
 *   fieldKey: translationKeys<T>;
 * };
 *
 * const props: FormFieldProps<"user"> = {
 *   namespace: "user",
 *   fieldKey: "form.stringRequired", // ✅ Type-safe!
 *   // fieldKey: "invalid_key", // ❌ Type error!
 * };
 * ```
 */
export type translationKeys<T extends useTranslationKeys = never> = Parameters<
  translatorType<T>
>[0];

/**
 * Utility type that finds all namespaces containing a specific field
 *
 * @example
 * ```tsx
 * // Find all namespaces with a "form" field
 * type NamespacesWithForm = NamespaceWithField<"form">;
 * // "user" (if user.json has a "form" field)
 *
 * // Usage in form components with type-safe namespace and field constraints
 * export const FormInput = <
 *   T extends NamespaceWithField<"form">,
 *   TSchema extends ZodSchemaType,
 *   TName extends Extract<ZodFieldName<TSchema>, translationKeys<T>>,
 * >({
 *   namespace,
 *   name,
 *   ...props
 * }: {
 *   namespace: T;
 *   name: TName;
 * }) => {
 *   const t = useTranslations(namespace);
 *   const fieldKey = `form.${String(name)}` as const;
 *   return <Input placeholder={t(fieldKey)} {...props} />;
 * };
 *
 * // ✅ Valid - "user" has a "form" field
 * <FormInput namespace="user" name="stringRequired" />
 * ```
 */
export type NamespaceWithField<
  field extends string,
  AllMessages extends object = Messages,
> = {
  [K in keyof AllMessages]: AllMessages[K] extends object
    ? field extends `${infer First}.${infer Rest}`
      ? First extends keyof AllMessages[K]
        ? AllMessages[K][First] extends object
          ? Rest extends keyof AllMessages[K][First]
            ? K
            : Rest extends `${infer _}.${infer __}`
              ? NamespaceWithField<
                  Rest,
                  {
                    namespace: AllMessages[K][First];
                  }
                > extends never
                ? never
                : K
              : never
          : never
        : never
      : AllMessages[K] extends { [key in field]: object | string }
        ? K
        : never
    : never;
}[keyof AllMessages];

export type NamespaceWithoutField<field extends string> = Exclude<
  keyof Messages,
  NamespaceWithField<field>
>;

export type NamespaceWithEN = NamespaceWithField<'en'>;

export type FormNamespace = NamespaceWithField<'form'>;
export type FormTranslationKey = `${FormNamespace}.form`;
