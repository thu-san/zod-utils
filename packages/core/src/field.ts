import { z } from 'zod';
import { extractDiscriminatedSchema, getPrimitiveType } from './schema';
import type {
  Discriminator,
  DiscriminatorKey,
  DiscriminatorValue,
} from './types';

export function extractFieldFromSchema<
  TSchema extends z.ZodType,
  TName extends keyof Extract<
    Required<z.input<TSchema>>,
    Record<TDiscriminatorKey, TDiscriminatorValue>
  >,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>({
  schema,
  fieldName,
  discriminator,
}: {
  schema: TSchema;
  fieldName: TName;
  discriminator?: Discriminator<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >;
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
