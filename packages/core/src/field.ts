import { type util, z } from 'zod';
import { extractDiscriminatedSchema } from './schema';

export function extractFieldFromSchema<
  TSchema extends z.ZodObject | z.ZodDiscriminatedUnion,
  TName extends keyof Extract<
    Required<z.infer<TSchema>>,
    Record<TDiscriminatorKey, TDiscriminatorValue>
  >,
  TDiscriminatorKey extends keyof z.infer<TSchema> & string,
  TDiscriminatorValue extends z.infer<TSchema>[TDiscriminatorKey] &
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
  } else {
    targetSchema = schema;
  }

  if (!targetSchema) return undefined;

  const field: z.ZodType = targetSchema.shape[String(fieldName)];

  return field;
}
