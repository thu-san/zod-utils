import type {
  Discriminator,
  DiscriminatorKey,
  DiscriminatorValue,
  ValidPaths,
} from '@zod-utils/core';
import type { JSX } from 'react';
import { z } from 'zod';

// -------------------------------------------------------------------------
// 1. Unwrapping Logic (Handles Pipe & Effects)
// -------------------------------------------------------------------------

/**
 * Recursively unwraps Zod wrappers to find the "source of truth" schema.
 * - Handles ZodPipeline (returns the INPUT schema: _def.in)
 * - Handles ZodEffects/Transformers (returns the INNER schema: _def.schema)
 */
type UnwrapSchema<T> = T extends z.ZodPipe<infer In>
  ? UnwrapSchema<In> // If pipe, dig into the input
  : T extends { _def: { schema: infer Inner } }
    ? UnwrapSchema<Inner> // If transform/effect, dig into the inner schema
    : T; // Otherwise, return T

// Update: Check the unwrapped version
type IsDiscriminatedUnion<S> = UnwrapSchema<S> extends z.ZodDiscriminatedUnion
  ? true
  : false;

// -------------------------------------------------------------------------
// 2. Strict Type Definitions
// -------------------------------------------------------------------------

type SchemaProp<TSchema extends z.ZodType> = {
  schema: TSchema;
} & JSX.IntrinsicAttributes;

type NameProp<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
> = {
  name: ValidPaths<TSchema, TDiscriminatorKey, TDiscriminatorValue>;
};

type DiscriminatorProp<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
> = IsDiscriminatedUnion<TSchema> extends true
  ? {
      discriminator: Discriminator<
        TSchema,
        TDiscriminatorKey,
        TDiscriminatorValue
      >;
    }
  : { discriminator?: never };

type TestLabelNameProp<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
> = SchemaProp<TSchema> &
  NameProp<TSchema, TDiscriminatorKey, TDiscriminatorValue> &
  DiscriminatorProp<TSchema, TDiscriminatorKey, TDiscriminatorValue>;

// -------------------------------------------------------------------------
// 3. The Component
// -------------------------------------------------------------------------

function TestLabel<
  TSchema extends z.ZodType,
  TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
  TDiscriminatorValue extends DiscriminatorValue<
    TSchema,
    TDiscriminatorKey
  > = never,
>(props: TestLabelNameProp<TSchema, TDiscriminatorKey, TDiscriminatorValue>) {
  return (
    <div>
      Label: {String(props.name)} <br />
      Discriminator: {JSON.stringify(props.discriminator ?? 'None')}
    </div>
  );
}

// -------------------------------------------------------------------------
// 4. The Factory
// -------------------------------------------------------------------------

export function FactoryFunc<TSchema extends z.ZodType>(
  props: SchemaProp<TSchema>,
) {
  return <
    TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    > = never,
  >(
    childProps: NameProp<TSchema, TDiscriminatorKey, TDiscriminatorValue> &
      DiscriminatorProp<TSchema, TDiscriminatorKey, TDiscriminatorValue>,
  ) => {
    return <TestLabel {...props} {...childProps} />;
  };
}

// -------------------------------------------------------------------------
// 5. Verification
// -------------------------------------------------------------------------

// A. Pipe Schema (Union -> Pipe)
const unionSchemaPipe = z
  .discriminatedUnion('kind', [
    z.object({ kind: z.literal('cat'), meows: z.boolean() }),
    z.object({ kind: z.literal('dog'), barks: z.boolean() }),
  ])
  .transform((data) => data);

// B. Object Schema (Object -> Pipe)
const objSchemaPipe = z
  .object({ fullName: z.string(), age: z.number() })
  .transform((data) => data);

const TestUnionPipeComponent = FactoryFunc({ schema: unionSchemaPipe });
const TestObjPipeComponent = FactoryFunc({ schema: objSchemaPipe });

export const Usage = () => {
  return (
    <>
      {/* ✅ Valid: Digs through pipe to find 'kind' and 'cat' */}
      <TestUnionPipeComponent
        discriminator={{
          key: 'kind',
          value: 'cat',
        }}
        name="meows" // 'meows' is valid for 'cat'
      />

      {/* ✅ Valid: Digs through pipe to find object keys */}
      <TestObjPipeComponent name="age" />

      {/* ❌ Valid: Digs through pipe to find 'kind' and 'cat' */}
      <TestUnionPipeComponent
        discriminator={{
          key: 'kind',
          value: 'cat',
        }}
        // @ts-expect-error 'barks' is invalid for 'cat'
        name="barks" // 'meows' is valid for 'cat'
      />
    </>
  );
};
