import { describe, expect, expectTypeOf, it } from 'vitest';
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

    // Primitives inside PartialFields are NOT nullable (just optional)
    // @ts-expect-error - primitives inside PartialFields don't accept null
    const invalid2: Result = { detail: { hotel: null } };

    void invalid1;
    void invalid2;
    void valid1;
    void valid2;
    void valid3;
    void valid4;
  });

  it('should handle deeply nested PartialFields with strict inner objects', () => {
    type Input = {
      a: string;
      b: number;
      nested: PartialFields<{
        c: number;
        d: Date;
        nested: { e: boolean };
      }>;
    };

    type Result = PartialWithNullableObjects<Input>;

    // Top-level primitives: optional but NOT nullable
    const valid1: Result = { a: 'test' };
    const valid2: Result = { a: undefined };
    // @ts-expect-error - top-level primitives don't accept null
    const invalid1: Result = { a: null };

    // Inside PartialFields: primitives are optional but NOT nullable
    const valid3: Result = { nested: { c: 5 } };
    const valid4: Result = { nested: { c: undefined } };
    // @ts-expect-error - primitives inside PartialFields don't accept null
    const invalid2: Result = { nested: { c: null } };

    // Inside PartialFields: Date is nullable (built-in object)
    const valid5: Result = { nested: { d: new Date() } };
    const valid6: Result = { nested: { d: null } };

    // Inside PartialFields: nested object is nullable
    const valid7: Result = { nested: { nested: null } };
    const valid8: Result = { nested: { nested: { e: true } } };

    // Inside PartialFields > nested object: fields are STRICT
    // @ts-expect-error - nested.nested.e is strict, not optional
    const invalid3: Result = { nested: { nested: {} } };
    // @ts-expect-error - nested.nested.e is strict, doesn't accept null
    const invalid4: Result = { nested: { nested: { e: null } } };

    void valid1;
    void valid2;
    void valid3;
    void valid4;
    void valid5;
    void valid6;
    void valid7;
    void valid8;
    void invalid1;
    void invalid2;
    void invalid3;
    void invalid4;
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

  describe('schemas with transforms', () => {
    it('should work with schema with transform', () => {
      const schema = z
        .object({
          hotel: z.string(),
          nights: z.number(),
        })
        .transform((data) => ({
          ...data,
          totalPrice: data.nights * 100,
        }));

      const branded = partialFields(schema);

      // Should parse and transform correctly
      const result = branded.parse({ hotel: 'Hilton', nights: 3 });
      expectTypeOf(result).toMatchTypeOf<
        PartialFields<{ hotel: string; nights: number; totalPrice: number }>
      >();
    });

    it('should work with optional fields and transform', () => {
      const schema = z
        .object({
          name: z.string(),
          description: z.string().optional(),
        })
        .transform((data) => ({
          ...data,
          hasDescription: !!data.description,
        }));

      const branded = partialFields(schema);

      const result = branded.parse({ name: 'Test' });
      expect(result.name).toBe('Test');
      expect(result.hasDescription).toBe(false);
    });
  });

  describe('discriminated union schemas', () => {
    it('should work with discriminated union', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('hotel'),
          hotelName: z.string(),
          nights: z.number(),
        }),
        z.object({
          type: z.literal('flight'),
          airline: z.string(),
          flightNumber: z.string(),
        }),
      ]);

      const branded = partialFields(schema);

      // Should parse hotel type
      const hotelResult = branded.parse({
        type: 'hotel',
        hotelName: 'Hilton',
        nights: 3,
      });
      expect(hotelResult.type).toBe('hotel');

      // Should parse flight type
      const flightResult = branded.parse({
        type: 'flight',
        airline: 'Delta',
        flightNumber: 'DL123',
      });
      expect(flightResult.type).toBe('flight');
    });

    it('should work with discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('create'),
            name: z.string(),
          }),
          z.object({
            type: z.literal('edit'),
            id: z.number(),
          }),
        ])
        .transform((data) => ({ ...data, processed: true }));

      const branded = partialFields(schema);

      const result = branded.parse({ type: 'create', name: 'Test' });
      expect(result.processed).toBe(true);
    });

    it('should work with discriminated union with superRefine', () => {
      const schema = z
        .discriminatedUnion('mode', [
          z.object({
            mode: z.literal('active'),
            count: z.number(),
          }),
          z.object({
            mode: z.literal('inactive'),
            reason: z.string(),
          }),
        ])
        .superRefine(() => {});

      const branded = partialFields(schema);

      const result = branded.parse({ mode: 'active', count: 5 });
      expect(result.mode).toBe('active');
    });
  });
});
