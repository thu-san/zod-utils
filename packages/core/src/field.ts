import { type util, z } from 'zod';
import { extractDiscriminatedSchema, getPrimitiveType } from './schema';

export function extractFieldFromSchema<
  TSchema extends z.ZodType,
  TName extends keyof Extract<
    Required<z.input<TSchema>>,
    Record<TDiscriminatorKey, TDiscriminatorValue>
  >,
  TDiscriminatorKey extends keyof z.input<TSchema> & string,
  TDiscriminatorValue extends z.input<TSchema>[TDiscriminatorKey] &
    util.Literal,
>({
  schema,
  fieldName,
  discriminator,
}: {
  schema: TSchema;
  fieldName: TName;
  discriminator?: {
    key: TDiscriminatorKey;
    value: TDiscriminatorValue;
  };
}) {
  let targetSchema: z.ZodObject | undefined;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const primitiveSchema = getPrimitiveType(schema) as TSchema;

  if (primitiveSchema instanceof z.ZodDiscriminatedUnion) {
    if (discriminator) {
      targetSchema = extractDiscriminatedSchema({
        schema: primitiveSchema,
        ...discriminator,
      });
    }
  } else if (primitiveSchema instanceof z.ZodObject) {
    targetSchema = primitiveSchema;
  }

  if (!targetSchema) return undefined;

  const field: z.ZodType = targetSchema.shape[String(fieldName)];

  return field;
}
