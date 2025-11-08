import type { ZodErrorMap } from 'zod';
import { createEnglishErrorMap } from './locales/en';
import { createJapaneseErrorMap } from './locales/ja';

/**
 * Field namespace mapping for custom error messages
 * You can extend this mapping to customize field names in error messages
 */
export const FieldNamespaceMapping = {
  department: {
    groupName: '部署・店舗名',
  },
};

export type FIELD_NAMESPACE = keyof typeof FieldNamespaceMapping;

/**
 * Custom error resolver with field namespace support (Japanese locale)
 * @deprecated Use createJapaneseErrorMap or createEnglishErrorMap instead
 * @param options - Configuration options
 * @param options.fieldNamespace - Namespace for field name mappings
 * @returns Error resolver function
 */
export const customErrorResolver = ({
  fieldNamespace,
}: {
  fieldNamespace: FIELD_NAMESPACE;
}) => {
  return (issue: Parameters<ZodErrorMap>[0]) => {
    const fieldName =
      FieldNamespaceMapping[fieldNamespace][
        String(
          issue.path?.[0],
        ) as keyof (typeof FieldNamespaceMapping)[typeof fieldNamespace]
      ] || undefined;

    return createJapaneseErrorMap(fieldName)(issue);
  };
};

// Re-export locale-specific error maps
export { createJapaneseErrorMap } from './locales/ja';
export { createEnglishErrorMap } from './locales/en';
