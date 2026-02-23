import * as z from 'zod';
import { extractDiscriminatedSchema } from './discriminatedSchema';
import {
  canUnwrap,
  getPrimitiveType,
  isPipeWithZodInput,
  tryStripNullishOnly,
} from './schema';
import type {
  DiscriminatorKey,
  DiscriminatorValue,
  SchemaAndDiscriminatorProps,
  Simplify,
} from './types';

/**
 * Type-safe helper to iterate over ZodObject shape entries.
 * @internal
 */
function getShapeEntries(
  schema: z.ZodObject,
): Array<[string, z.ZodType | undefined]> {
  return Object.entries(schema.shape);
}

/**
 * Extracts the value of a specific meta key from a Zod field, recursively unwrapping
 * optional, nullable, default, transform, and union layers.
 *
 * For `ZodObject` fields: if the object's own meta contains the target key, returns that
 * value directly (stops recursion). If not, recurses into shape children and returns
 * a nested record of meta values.
 *
 * @param field - The Zod field to extract meta from
 * @param metaKey - The meta property key to extract
 * @returns The meta value if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const field = z.string().meta({ label: 'Name' });
 * extractMeta(field, 'label'); // 'Name'
 * ```
 *
 * @example
 * ```typescript
 * const field = z.string().meta({ label: 'Name' }).optional();
 * extractMeta(field, 'label'); // 'Name' (unwraps optional)
 * ```
 *
 * @see {@link getSchemaMeta} for extracting meta from entire schemas
 * @since 0.3.0
 */
export function extractMeta(field: z.ZodType, metaKey: string): unknown {
  // Check meta on the current field first
  const meta = field.meta();
  if (meta && metaKey in meta) {
    return meta[metaKey];
  }

  // ZodObject is checked before generic unwrapping because we need to either
  // return the object's own meta value or recurse into its shape children.
  if (field instanceof z.ZodObject) {
    const nested: Record<string, unknown> = {};
    let hasAny = false;

    for (const [key, nestedField] of getShapeEntries(field)) {
      if (!nestedField) continue;

      const value = extractMeta(nestedField, metaKey);
      if (value !== undefined) {
        nested[key] = value;
        hasAny = true;
      }
    }

    if (hasAny) {
      return nested;
    }
    return undefined;
  }

  // For arrays: unwrap to element type and wrap result in array
  if (field instanceof z.ZodArray) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const elementMeta = extractMeta(field.unwrap() as z.ZodType, metaKey);
    if (elementMeta !== undefined) {
      return [elementMeta];
    }
    return undefined;
  }

  // Unwrap wrapper types
  if (canUnwrap(field)) {
    return extractMeta(field.unwrap(), metaKey);
  }

  // Handle unions by stripping nullish
  if (field instanceof z.ZodUnion) {
    const unwrapped = tryStripNullishOnly(field);
    if (unwrapped !== false) {
      return extractMeta(unwrapped, metaKey);
    }
    return undefined;
  }

  // Handle transforms (ZodPipe)
  if (isPipeWithZodInput(field)) {
    return extractMeta(field.def.in, metaKey);
  }

  return undefined;
}

/**
 * Extracts the value of a specific meta key from all fields in a Zod schema.
 *
 * Returns a nested record where each key maps to the meta value for that field.
 * Fields without the specified meta key are omitted.
 *
 * For `ZodObject` fields: if the object has the target meta key in its own meta,
 * returns that value directly. Otherwise, recurses into shape children.
 *
 * Supports discriminated unions via the `discriminator` parameter.
 *
 * @param params - Schema and optional discriminator configuration
 * @param metaKey - The meta property key to extract
 * @returns Record mapping field names to their meta values
 *
 * To get typed meta keys with autocomplete, augment Zod's `GlobalMeta` interface:
 *
 * ```typescript
 * // types/zod.ts
 * import * as z from 'zod';
 *
 * declare module 'zod' {
 *   interface GlobalMeta {
 *     label: string;               // static type for all schemas
 *     type: z.$output;             // resolves to the schema's output type
 *     inputType: z.$input;         // resolves to the schema's input type
 *     placeholder?: string;
 *   }
 * }
 * ```
 *
 * With `z.$output` / `z.$input`, Zod automatically types `.meta()` values
 * based on each schema's inferred type:
 *
 * ```typescript
 * z.string().meta({ type: 'hello' })  // ✅ type is string
 * z.string().meta({ type: 42 })       // ❌ TypeScript error — expects string
 * z.number().meta({ type: 42 })       // ✅ type is number
 * ```
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: z.string().meta({ label: 'Name' }),
 *   age: z.number().meta({ label: 'Age' }),
 * });
 * getSchemaMeta({ schema }, 'label');
 * // { name: 'Name', age: 'Age' }
 * ```
 *
 * @see {@link extractMeta} for extracting meta from individual fields
 * @since 0.3.0
 */
export function getSchemaMeta<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema>,
  TDiscriminatorValue extends DiscriminatorValue<TSchema, TDiscriminatorKey>,
>(
  params: SchemaAndDiscriminatorProps<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue
  >,
  metaKey: string,
): Simplify<Partial<z.input<TSchema>>> {
  const primitiveSchemaParams = {
    ...params,
    schema: getPrimitiveType(params.schema),
  };

  let targetSchema: z.ZodObject | undefined;
  if (primitiveSchemaParams.schema instanceof z.ZodDiscriminatedUnion) {
    targetSchema = extractDiscriminatedSchema(primitiveSchemaParams);
  } else if (primitiveSchemaParams.schema instanceof z.ZodObject) {
    targetSchema = primitiveSchemaParams.schema;
  }

  const result: Record<string, unknown> = {};

  if (targetSchema) {
    for (const [key, field] of getShapeEntries(targetSchema)) {
      if (!field) continue;

      const value = extractMeta(field, metaKey);
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return result as Partial<z.input<TSchema>>;
}
