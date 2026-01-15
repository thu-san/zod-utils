import { z } from 'zod';
import {
  type ExtractZodUnionMember,
  extractDiscriminatedSchema,
} from './discriminatedSchema';
import { getPrimitiveType } from './schema';
import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelectorProps,
  IsDiscriminatedUnion,
  UnwrapZodType,
} from './types';

/**
 * Type-safe helper to get a field from ZodObject shape by key.
 * @internal
 */
function getShapeField(
  schema: z.ZodObject,
  key: string,
): z.ZodType | undefined {
  return Object.entries(schema.shape).find(([k]) => k === key)?.[1];
}

// Split 'a.b.c' into ['a', 'b', 'c']
type Split<S extends string> = S extends `${infer Head}.${infer Tail}`
  ? [Head, ...Split<Tail>]
  : [S];

// Check if string is numeric
type IsNumeric<S extends string> = S extends `${number}` ? true : false;

// Unwrap ZodOptional, ZodNullable, ZodDefault, ZodPipe (transforms)
type Unwrap<T> = T extends z.ZodOptional<infer U>
  ? Unwrap<U>
  : T extends z.ZodNullable<infer U>
    ? Unwrap<U>
    : T extends z.ZodDefault<infer U>
      ? Unwrap<U>
      : T extends z.ZodPipe<infer In, z.ZodType>
        ? Unwrap<In>
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

/**
 * Extract field from a discriminated union variant.
 * First extracts the variant using ExtractZodUnionMember, then navigates through it.
 * @internal
 */
type ExtractFromDiscriminatedUnion<
  TSchema extends z.ZodType,
  TName extends string,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
  TUnwrapped extends z.ZodType = UnwrapZodType<TSchema> extends z.ZodType
    ? UnwrapZodType<TSchema>
    : TSchema,
  TVariant = TUnwrapped extends z.ZodDiscriminatedUnion
    ? ExtractZodUnionMember<
        TUnwrapped,
        Extract<TDiscriminatorKey, DiscriminatorKey<TUnwrapped>>,
        Extract<
          TDiscriminatorValue,
          DiscriminatorValue<
            TUnwrapped,
            Extract<TDiscriminatorKey, DiscriminatorKey<TUnwrapped>>
          >
        >
      >
    : never,
> = TVariant extends z.ZodType ? ExtractZodByPath<TVariant, TName> : never;

/**
 * Helper type to determine if field extraction should succeed.
 * Returns true when:
 * 1. For discriminated unions: discriminator is provided (trust the user)
 * 2. For non-unions: the path resolves to a valid type (not never)
 * @internal
 */
type CanExtractField<
  TSchema extends z.ZodType,
  TName extends string,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
> = IsDiscriminatedUnion<TSchema> extends true // Discriminated union - check if discriminator is provided
  ? [TDiscriminatorKey] extends [never]
    ? false // No discriminator = can't extract
    : true // Discriminator provided = trust it
  : // Not a discriminated union - check if path is valid
    [ExtractZodByPath<TSchema, TName>] extends [never]
    ? false
    : true;

/**
 * Conditional return type for extractFieldFromSchema.
 * For discriminated unions: extracts variant first, then navigates.
 * For non-unions: navigates directly.
 * @internal
 */
type ExtractFieldResult<
  TSchema extends z.ZodType,
  TName extends string,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = DiscriminatorValue<TSchema, TDiscriminatorKey>,
> = CanExtractField<TSchema, TName, TDiscriminatorKey> extends true
  ? IsDiscriminatedUnion<TSchema> extends true
    ? // For discriminated unions: extract variant first, then navigate
      [
        ExtractFromDiscriminatedUnion<
          TSchema,
          TName,
          TDiscriminatorKey,
          TDiscriminatorValue
        >,
      ] extends [never]
      ? z.ZodType // Path couldn't be resolved, return generic type
      : ExtractFromDiscriminatedUnion<
          TSchema,
          TName,
          TDiscriminatorKey,
          TDiscriminatorValue
        > &
          z.ZodType
    : // For non-unions: navigate directly
      ExtractZodByPath<TSchema, TName> & z.ZodType
  : (ExtractZodByPath<TSchema, TName> & z.ZodType) | undefined;

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
): ExtractFieldResult<TSchema, TName, TDiscriminatorKey, TDiscriminatorValue> {
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

  if (!currentSchema)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return undefined as ExtractFieldResult<
      TSchema,
      TName,
      TDiscriminatorKey,
      TDiscriminatorValue
    >;

  // Split name into segments (e.g., "contact.email" -> ["contact", "email"])
  const segments = String(newParams.name).split('.');

  for (const segment of segments) {
    if (!currentSchema)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return undefined as ExtractFieldResult<
        TSchema,
        TName,
        TDiscriminatorKey,
        TDiscriminatorValue
      >;

    const unwrapped: z.ZodType = getPrimitiveType(currentSchema);

    if (unwrapped instanceof z.ZodObject) {
      currentSchema = getShapeField(unwrapped, segment);
    } else if (unwrapped instanceof z.ZodArray) {
      // Arrays are keyed by integers only
      if (/^\d+$/.test(segment) && unwrapped.element instanceof z.ZodType) {
        currentSchema = unwrapped.element;
      } else {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return undefined as ExtractFieldResult<
          TSchema,
          TName,
          TDiscriminatorKey
        >;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return undefined as ExtractFieldResult<
        TSchema,
        TName,
        TDiscriminatorKey,
        TDiscriminatorValue
      >;
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return currentSchema as ExtractFieldResult<
    TSchema,
    TName,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
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
