import { describe, expectTypeOf, it } from 'vitest';
import z from 'zod';
import {
  type PartialFields,
  type PartialWithAllNullables,
  type PartialWithNullableObjects,
  partialFields,
} from '../types';

describe('PartialWithNullableObjects (non-recursive)', () => {
  it('should make primitives optional but NOT nullable', () => {
    type Input = {
      name: string;
      age: number;
      active: boolean;
    };

    type Result = PartialWithNullableObjects<Input>;

    // All primitives can be omitted or set to undefined
    const valid1: Result = {};
    const valid2: Result = { name: 'test' };
    const valid3: Result = { name: undefined };
    const valid4: Result = { age: undefined };

    // Primitives should NOT accept null
    // @ts-expect-error - primitive fields don't accept null
    const invalid1: Result = { name: null };

    void valid1;
    void valid2;
    void valid3;
    void valid4;
    void invalid1;
  });

  it('should make arrays optional but NOT nullable', () => {
    type Input = {
      tags: string[];
      scores: number[];
    };

    type Result = PartialWithNullableObjects<Input>;

    // Arrays can be omitted or set to undefined
    const valid1: Result = {};
    const valid2: Result = { tags: ['a', 'b'] };
    const valid3: Result = { tags: undefined };

    // Arrays should NOT accept null
    // @ts-expect-error - array fields don't accept null
    const invalid1: Result = { tags: null };

    void valid1;
    void valid2;
    void valid3;
    void invalid1;
  });

  it('should make objects optional and nullable but NOT recurse into nested fields', () => {
    type Input = {
      profile: {
        bio: string;
        age: number;
      };
    };

    type Result = PartialWithNullableObjects<Input>;

    // Object can be omitted, null, or complete
    const valid1: Result = {};
    const valid2: Result = { profile: null };
    const valid3: Result = { profile: undefined };
    const valid4: Result = { profile: { bio: 'hello', age: 25 } };

    // Nested object with missing field should NOT be allowed
    // @ts-expect-error - nested object fields are strict
    const invalid1: Result = { profile: { bio: 'hello' } };

    void valid1;
    void valid2;
    void valid3;
    void valid4;
    void invalid1;
  });

  it('should handle Date and built-in objects as nullable', () => {
    type Input = {
      createdAt: Date;
      pattern: RegExp;
    };

    type Result = PartialWithNullableObjects<Input>;

    // Built-in objects can be null
    const valid1: Result = { createdAt: null };
    const valid2: Result = { pattern: null };
    const valid3: Result = { createdAt: new Date() };

    void valid1;
    void valid2;
    void valid3;
  });

  it('should handle PartialFields branded objects with recursive transformation', () => {
    type Input = {
      // Regular object - stays strict
      agent: { name: string; fee: number };
      // PartialFields marked - gets recursive partial
      detail: PartialFields<{ hotel: string; nights: number }>;
    };

    type Result = PartialWithNullableObjects<Input>;

    // Regular object requires all fields when provided
    // @ts-expect-error - agent nested fields are strict
    const invalid1: Result = { agent: { name: 'John' } };

    // PartialFields object allows partial nested
    const valid1: Result = { detail: { hotel: 'Hilton' } };
    const valid2: Result = { detail: {} };
    const valid3: Result = { detail: null };

    // Both can be null or omitted
    const valid4: Result = { agent: null, detail: null };

    void invalid1;
    void valid1;
    void valid2;
    void valid3;
    void valid4;
  });
});

describe('PartialWithAllNullables (non-recursive)', () => {
  it('should make all fields optional and nullable', () => {
    type Input = {
      name: string;
      age: number;
      tags: string[];
    };

    type Result = PartialWithAllNullables<Input>;

    // All fields can be null
    const valid1: Result = { name: null };
    const valid2: Result = { age: null };
    const valid3: Result = { tags: null };
    const valid4: Result = { name: 'test', age: null, tags: null };

    void valid1;
    void valid2;
    void valid3;
    void valid4;
  });

  it('should make objects nullable but NOT recurse into nested fields', () => {
    type Input = {
      profile: {
        bio: string;
        age: number;
      };
    };

    type Result = PartialWithAllNullables<Input>;

    // Object can be null or complete
    const valid1: Result = { profile: null };
    const valid2: Result = { profile: { bio: 'hello', age: 25 } };

    // Nested object with missing field should NOT be allowed
    // @ts-expect-error - nested object fields are strict
    const invalid1: Result = { profile: { bio: 'hello' } };

    void valid1;
    void valid2;
    void invalid1;
  });

  it('should handle PartialFields branded objects with recursive transformation', () => {
    type Input = {
      // Regular object - stays strict
      agent: { name: string; fee: number };
      // PartialFields marked - gets recursive nullable partial
      detail: PartialFields<{ hotel: string; nights: number }>;
    };

    type Result = PartialWithAllNullables<Input>;

    // Regular object requires all fields when provided
    // @ts-expect-error - agent nested fields are strict
    const invalid1: Result = { agent: { name: 'John' } };

    // PartialFields object allows partial and null nested
    const valid1: Result = { detail: { hotel: 'Hilton' } };
    const valid2: Result = { detail: { hotel: null } };
    const valid3: Result = { detail: {} };

    void invalid1;
    void valid1;
    void valid2;
    void valid3;
  });
});

describe('partialFields helper', () => {
  it('should return the same schema with PartialFields branded output type', () => {
    const schema = z.object({
      hotel: z.string(),
      nights: z.number(),
    });

    const branded = partialFields(schema);

    // Should parse the same
    const result = branded.parse({ hotel: 'Hilton', nights: 3 });
    expectTypeOf(result).toEqualTypeOf<
      PartialFields<{ hotel: string; nights: number }>
    >();
  });

  it('should work in a real schema composition', () => {
    const detailSchema = partialFields(
      z.object({
        hotel: z.string(),
        nights: z.number(),
      }),
    );

    const schema = z.object({
      price: z.number(),
      detail: detailSchema,
      agent: z.object({
        name: z.string(),
        fee: z.number(),
      }),
    });

    type SchemaOutput = z.infer<typeof schema>;

    // detail should have PartialFields brand
    expectTypeOf<SchemaOutput['detail']>().toExtend<
      PartialFields<{ hotel: string; nights: number }>
    >();

    // agent should NOT have PartialFields brand
    expectTypeOf<SchemaOutput['agent']>().toEqualTypeOf<{
      name: string;
      fee: number;
    }>();
  });
});
