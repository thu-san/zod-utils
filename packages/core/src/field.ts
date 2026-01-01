import { z } from 'zod';
import { extractDiscriminatedSchema } from './discriminatedSchema';
import { getPrimitiveType } from './schema';
import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelectorProps,
} from './types';

// Split 'a.b.c' into ['a', 'b', 'c']
type Split<S extends string> = S extends `${infer Head}.${infer Tail}`
  ? [Head, ...Split<Tail>]
  : [S];

// Check if string is numeric
type IsNumeric<S extends string> = S extends `${number}` ? true : false;

// Unwrap ZodOptional, ZodNullable, ZodDefault
type Unwrap<T> = T extends z.ZodOptional<infer U>
  ? Unwrap<U>
  : T extends z.ZodNullable<infer U>
    ? Unwrap<U>
    : T extends z.ZodDefault<infer U>
      ? Unwrap<U>
      : T;

// Navigate Zod schema by path array
type NavigateZod<T, Path extends string[]> = Path extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? Unwrap<T> extends z.ZodObject<infer Shape>
    ? First extends keyof Shape
      ? Rest extends []
        ? Shape[First]
        : NavigateZod<Shape[First], Rest>
      : never
    : Unwrap<T> extends z.ZodArray<infer Element>
      ? IsNumeric<First> extends true
        ? Rest extends []
          ? Element
          : NavigateZod<Element, Rest>
        : never
      : never
  : T;

export type ExtractZodByPath<Schema, Path extends string> = NavigateZod<
  Schema,
  Split<Path>
>;

export function extractFieldFromSchema<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
  TFilterType = unknown,
  TStrict extends boolean = true,
  TName extends string = string,
>(
  params: FieldSelectorProps<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  > & { name: TName },
): (ExtractZodByPath<TSchema, TName> & z.ZodType) | undefined {
  let currentSchema: z.ZodType | undefined;

  const newParams = {
    ...params,
    schema: getPrimitiveType(params.schema),
  };

  if (newParams.schema instanceof z.ZodDiscriminatedUnion) {
    if (newParams.discriminator) {
      currentSchema = extractDiscriminatedSchema(newParams);
    }
  } else if (newParams.schema instanceof z.ZodObject) {
    currentSchema = newParams.schema;
  }

  if (!currentSchema) return undefined;

  // Split name into segments (e.g., "contact.email" -> ["contact", "email"])
  const segments = String(newParams.name).split('.');

  for (const segment of segments) {
    if (!currentSchema) return undefined;

    const unwrapped: z.ZodType = getPrimitiveType(currentSchema);

    if (unwrapped instanceof z.ZodObject) {
      currentSchema = unwrapped.shape[segment];
    } else if (unwrapped instanceof z.ZodArray) {
      // Arrays are keyed by integers only
      if (/^\d+$/.test(segment) && unwrapped.element instanceof z.ZodType) {
        currentSchema = unwrapped.element;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return currentSchema as
    | (ExtractZodByPath<TSchema, TName> & z.ZodType)
    | undefined;
}

/**
 * Extends a Zod field with a transformation while preserving its metadata.
 *
 * This is useful when you want to add validations or transformations to a field
 * but keep the original metadata (like translationKey) intact.
 *
 * @param field - The original Zod field
 * @param transform - A function that transforms the field
 * @returns The transformed field with preserved metadata
 *
 * @example
 * ```typescript
 * const baseField = z.string().meta({ translationKey: 'user.field.name' });
 *
 * // Add min/max validation while keeping the translationKey
 * const extendedField = extendWithMeta(baseField, (f) => f.min(3).max(100));
 * extendedField.meta(); // { translationKey: 'user.field.name' }
 * ```
 */
export function extendWithMeta<T extends z.ZodType, R extends z.ZodType>(
  field: T,
  transform: (f: T) => R,
): R {
  const transformedField = transform(field);
  const meta = field.meta();
  if (!meta) {
    return transformedField;
  }
  return transformedField.meta({ ...meta });
}
