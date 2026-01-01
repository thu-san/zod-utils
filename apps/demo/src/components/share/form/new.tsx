import type {
  DiscriminatorKey,
  DiscriminatorValue,
  FieldSelectorProps,
  NameAndDiscriminatorProps,
  SchemaProps,
} from '@zod-utils/core';
import type { JSX } from 'react';
import { z } from 'zod';

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
  TFilterType = unknown,
  TStrict extends boolean = true,
>(
  props: FieldSelectorProps<
    TSchema,
    TDiscriminatorKey,
    TDiscriminatorValue,
    TFilterType,
    TStrict
  >,
) {
  console.log(props);
  return null;
}

// -------------------------------------------------------------------------
// 4. The Factory
// -------------------------------------------------------------------------

export function FactoryFunc<TSchema extends z.ZodType>(
  props: SchemaProps<TSchema> & JSX.IntrinsicAttributes,
) {
  return <
    TDiscriminatorKey extends DiscriminatorKey<TSchema> = never,
    TDiscriminatorValue extends DiscriminatorValue<
      TSchema,
      TDiscriminatorKey
    > = never,
    TFilterType = unknown,
    TStrict extends boolean = true,
  >(
    childProps: NameAndDiscriminatorProps<
      TSchema,
      TDiscriminatorKey,
      TDiscriminatorValue,
      TFilterType,
      TStrict
    >,
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
