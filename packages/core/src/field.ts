import { type util, z } from 'zod';
import { extractDiscriminatedSchema } from './schema';

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

  if (schema instanceof z.ZodDiscriminatedUnion) {
    if (discriminator) {
      targetSchema = extractDiscriminatedSchema({
        schema,
        ...discriminator,
      });
    }
  } else if (schema instanceof z.ZodObject) {
    targetSchema = schema;
  }

  if (!targetSchema) return undefined;

  const field: z.ZodType = targetSchema.shape[String(fieldName)];

  return field;
}
