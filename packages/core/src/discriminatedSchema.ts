import { type util, z } from 'zod';
import type { $InferUnionInput } from 'zod/v4/core';
import { getPrimitiveType } from './schema';
import type {
  DiscriminatorKey,
  DiscriminatorValue,
  SchemaAndDiscriminatorField,
} from './types';

/**
 * Recursively extracts the exact schema type from a discriminated union based on the discriminator value.
 *
 * This advanced TypeScript utility type walks through a union's options tuple at compile-time,
 * checking each schema against the discriminator field and value, and returns the exact matching
 * schema type (not a union of all options).
 *
 * **How it works:**
 * 1. Extracts the options tuple from the union using `infer Options`
 * 2. Destructure into head (`First`) and tail (`Rest`) using tuple pattern matching
 * 3. Checks if `First` is a ZodObject with the matching discriminator field and value
 * 4. If match found, returns `First` (the exact schema type)
 * 5. If no match, recursively processes `Rest` until a match is found or list is exhausted
 *
 * **Type narrowing magic:**
 * - Input: `z.discriminatedUnion('type', [SchemaA, SchemaB, SchemaC])`
 * - Discriminator value: `'a'` (matches SchemaA)
 * - Output: `SchemaA` (exact type, not `SchemaA | SchemaB | SchemaC`)
 *
 * @template TSchema - The ZodUnion or ZodDiscriminatedUnion type
 * @template TDiscriminatorKey - The discriminator field name (e.g., "type", "mode")
 * @template TDiscriminatorValue - The specific discriminator value (e.g., "create", "edit")
 * @returns The exact matching schema type, or `never` if no match found
 *
 * @example
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 *   z.object({ mode: z.literal('edit'), id: z.number() }),
 * ]);
 *
 * // Exact type: z.object({ mode: z.literal('create'), name: z.string() })
 * type CreateSchema = ExtractZodUnionMember<typeof schema, 'mode', 'create'>;
 * ```
 */
type ExtractZodUnionMember<
  TSchema extends z.ZodUnion | z.ZodDiscriminatedUnion,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends z.input<TSchema>[TDiscriminatorKey] &
    util.Literal,
> = TSchema extends z.ZodUnion<infer Options>
  ? Options extends readonly [
      infer First extends z.ZodTypeAny,
      ...infer Rest extends z.ZodTypeAny[],
    ]
    ? First extends z.ZodObject<infer Shape>
      ? TDiscriminatorKey extends keyof Shape
        ? Shape[TDiscriminatorKey] extends
            | z.ZodLiteral<TDiscriminatorValue>
            | z.ZodDefault<z.ZodLiteral<TDiscriminatorValue>>
          ? First
          : Rest extends []
            ? never
            : TDiscriminatorValue extends $InferUnionInput<
                  Rest[number]
                >[TDiscriminatorKey]
              ? ExtractZodUnionMember<
                  z.ZodUnion<Rest>,
                  TDiscriminatorKey,
                  TDiscriminatorValue
                >
              : never
        : Rest extends []
          ? never
          : TDiscriminatorValue extends $InferUnionInput<
                Rest[number]
              >[TDiscriminatorKey]
            ? ExtractZodUnionMember<
                z.ZodUnion<Rest>,
                TDiscriminatorKey,
                TDiscriminatorValue
              >
            : never
      : never
    : never
  : never;

/**
 * Extracts a specific schema option from a discriminated union based on the discriminator field value.
 *
 * This function finds and returns the **exact matching schema** from a `ZodDiscriminatedUnion` by
 * comparing the discriminator field value. It's used internally by {@link getSchemaDefaults} to
 * extract defaults from the correct schema variant in a discriminated union.
 *
 * **Key feature:** Returns the **exact schema type**, not a union of all options, thanks to the
 * {@link ExtractZodUnionMember} recursive type utility. This enables precise type narrowing at
 * compile-time based on the discriminator value.
 *
 * **How it works:**
 * 1. Iterates through all options in the discriminated union at runtime
 * 2. For each option, validates it's a ZodObject and checks if the discriminator field matches
 * 3. Returns the first matching schema with its exact type narrowed at compile-time
 * 4. Returns `undefined` if no match found or if option is not a ZodObject
 *
 * @template TSchema - The ZodUnion or ZodDiscriminatedUnion schema type
 * @template TDiscriminatorKey - The discriminator field name (string key of the inferred union type)
 * @template TDiscriminatorValue - The specific discriminator value to match (literal type)
 * @param params - Parameters object
 * @param params.schema - The discriminated union schema to search
 * @param params.discriminatorKey - The discriminator field name (e.g., "mode", "type")
 * @param params.discriminatorValue - The discriminator value to match (e.g., "create", "edit")
 * @returns The exact matching schema option (with precise type), or `undefined` if not found
 *
 * @example
 * Basic discriminated union - create/edit mode
 * ```typescript
 * const userSchema = z.discriminatedUnion('mode', [
 *   z.object({
 *     mode: z.literal('create'),
 *     name: z.string(),
 *     age: z.number().optional(),
 *   }),
 *   z.object({
 *     mode: z.literal('edit'),
 *     id: z.number(),
 *     name: z.string().optional(),
 *   }),
 * ]);
 *
 * // Extract the "create" schema
 * const createSchema = extractDiscriminatedSchema({
 *   schema: userSchema,
 *   discriminator: { key: 'mode', value: 'create' },
 * });
 * // Result: z.object({ mode: z.literal('create'), name: z.string(), age: z.number().optional() })
 *
 * // Extract the "edit" schema
 * const editSchema = extractDiscriminatedSchema({
 *   schema: userSchema,
 *   discriminator: { key: 'mode', value: 'edit' },
 * });
 * // Result: z.object({ mode: z.literal('edit'), id: z.number(), name: z.string().optional() })
 * ```
 *
 * @example
 * Type-based discrimination
 * ```typescript
 * const eventSchema = z.discriminatedUnion('type', [
 *   z.object({ type: z.literal('click'), x: z.number(), y: z.number() }),
 *   z.object({ type: z.literal('keypress'), key: z.string() }),
 * ]);
 *
 * const clickSchema = extractDiscriminatedSchema({
 *   schema: eventSchema,
 *   discriminator: { key: 'type', value: 'click' },
 * });
 * // Result: z.object({ type: z.literal('click'), x: z.number(), y: z.number() })
 * ```
 *
 * @example
 * Invalid discriminator value
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string() }),
 * ]);
 *
 * const result = extractDiscriminatedSchema({
 *   schema,
 *   discriminator: { key: 'mode', value: 'invalid' }, // doesn't match any option
 * });
 * // Result: undefined
 * ```
 *
 * @example
 * Type narrowing demonstration
 * ```typescript
 * const schema = z.discriminatedUnion('mode', [
 *   z.object({ mode: z.literal('create'), name: z.string(), age: z.number() }),
 *   z.object({ mode: z.literal('edit'), id: z.number(), bio: z.string() }),
 * ]);
 *
 * const createSchema = extractDiscriminatedSchema({
 *   schema,
 *   discriminator: { key: 'mode', value: 'create' },
 * });
 *
 * // Type is EXACTLY: z.object({ mode: z.literal('create'), name: z.string(), age: z.number() })
 * // NOT: z.object({ mode: ..., ... }) | z.object({ mode: ..., ... }) | undefined
 *
 * if (createSchema) {
 *   createSchema.shape.age;  // ✅ TypeScript knows 'age' exists
 *   createSchema.shape.name; // ✅ TypeScript knows 'name' exists
 *   // createSchema.shape.id;   // ❌ TypeScript error: 'id' doesn't exist on 'create' schema
 * }
 * ```
 *
 * @see {@link getSchemaDefaults} for usage with discriminated unions
 * @see {@link ExtractZodUnionMember} for the type-level extraction logic
 * @since 0.6.0
 */
export const extractDiscriminatedSchema = <
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
  ReturnType extends TSchema extends z.ZodDiscriminatedUnion
    ? ExtractZodUnionMember<TSchema, TDiscriminatorKey, TDiscriminatorValue>
    : never,
>({
  schema,
  discriminator,
}: SchemaAndDiscriminatorField<
  TSchema,
  TDiscriminatorKey,
  TDiscriminatorValue
>): ReturnType => {
  const primitiveSchema = getPrimitiveType(schema);

  if (!(primitiveSchema instanceof z.ZodDiscriminatedUnion) || !discriminator) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return undefined as ReturnType;
  }

  const { key, value } = discriminator;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return primitiveSchema.options.find((option) => {
    if (option instanceof z.ZodObject) {
      const targetField = option.shape[String(key)];
      if (!targetField) return false;

      const parseResult = targetField.safeParse(value);
      return parseResult.success;
    }
    return false;
  }) as ReturnType;
};
