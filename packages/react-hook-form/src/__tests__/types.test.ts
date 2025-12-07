import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import type {
  PartialWithAllNullables,
  PartialWithNullableObjects,
  ValidFieldPathsOfType,
} from '../types';

describe('PartialWithNullableObjects', () => {
  it('should make properties optional with different nullable behavior for primitives vs objects', () => {
    type Input = {
      name: string;
      age: number;
      active: boolean;
    };

    type Result = PartialWithNullableObjects<Input>;

    // All are primitives: optional but NOT nullable
    expectTypeOf<Result>().toMatchTypeOf<{
      name?: string | undefined;
      age?: number | undefined;
      active?: boolean | undefined;
    }>();

    // Should accept objects with missing properties
    expectTypeOf<Record<string, never>>().toMatchTypeOf<Result>();
    expectTypeOf<{ name: 'test' }>().toMatchTypeOf<Result>();

    // Primitives accept undefined but NOT null
    expectTypeOf<{ name: undefined }>().toMatchTypeOf<Result>();
    expectTypeOf<{ age: undefined }>().toMatchTypeOf<Result>();
    expectTypeOf<{ active: undefined }>().toMatchTypeOf<Result>();
  });

  it('should preserve existing optional properties', () => {
    type Input = {
      required: string;
      optional?: number;
    };

    type Result = PartialWithNullableObjects<Input>;

    // Both are primitives: optional but not nullable
    expectTypeOf<Result>().toMatchTypeOf<{
      required?: string | undefined;
      optional?: number | undefined;
    }>();
  });

  it('should handle already nullable properties', () => {
    type Input = {
      nullableString: string | null;
      nullableNumber: number | null;
    };

    type Result = PartialWithNullableObjects<Input>;

    // Union types with null don't extend object, so treated as primitives
    // Preserves the null in the union, just adds optional and undefined
    expectTypeOf<Result>().toMatchTypeOf<{
      nullableString?: string | null | undefined;
      nullableNumber?: number | null | undefined;
    }>();
  });

  it('should handle nested objects', () => {
    type Input = {
      user: {
        name: string;
        email: string;
      };
    };

    type Result = PartialWithNullableObjects<Input>;

    // Nested object itself becomes optional and nullable
    // (Note: doesn't deeply transform nested properties)
    expectTypeOf<Result>().toMatchTypeOf<{
      user?:
        | {
            name: string;
            email: string;
          }
        | null
        | undefined;
    }>();

    // Should accept missing nested object
    expectTypeOf<Record<string, never>>().toMatchTypeOf<Result>();
    expectTypeOf<{ user: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ user: undefined }>().toMatchTypeOf<Result>();
  });

  it('should handle arrays', () => {
    type Input = {
      tags: string[];
      scores: number[];
    };

    type Result = PartialWithNullableObjects<Input>;

    // Arrays: optional but NOT nullable
    expectTypeOf<Result>().toMatchTypeOf<{
      tags?: string[] | undefined;
      scores?: number[] | undefined;
    }>();

    // Arrays accept undefined but NOT null
    expectTypeOf<{ tags: undefined }>().toMatchTypeOf<Result>();
    expectTypeOf<{ scores: undefined }>().toMatchTypeOf<Result>();
  });

  it('should handle union types', () => {
    type Input = {
      status: 'active' | 'inactive';
      value: string | number;
    };

    type Result = PartialWithNullableObjects<Input>;

    // Union types of primitives don't extend object: optional but NOT nullable
    expectTypeOf<Result>().toMatchTypeOf<{
      status?: 'active' | 'inactive' | undefined;
      value?: string | number | undefined;
    }>();
  });

  it('should handle Date and other built-in types', () => {
    type Input = {
      createdAt: Date;
      pattern: RegExp;
    };

    type Result = PartialWithNullableObjects<Input>;

    expectTypeOf<Result>().toMatchTypeOf<{
      createdAt?: Date | null | undefined;
      pattern?: RegExp | null | undefined;
    }>();
  });

  it('should handle empty objects', () => {
    // biome-ignore lint/complexity/noBannedTypes: Testing empty object type
    type Input = {};

    type Result = PartialWithNullableObjects<Input>;

    // biome-ignore lint/complexity/noBannedTypes: Testing empty object type
    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });

  it('should NOT allow null for primitives and arrays, but allow for objects', () => {
    type Input = {
      name: string;
      tags: string[];
      age: number;
      profile: { bio: string };
    };

    type Result = PartialWithNullableObjects<Input>;

    // Primitive fields should NOT accept null
    // @ts-expect-error - primitive fields don't accept null
    const invalid1: Result = { name: null };

    // @ts-expect-error - primitive fields don't accept null
    const invalid2: Result = { age: null };

    // Array fields should NOT accept null
    // @ts-expect-error - array fields don't accept null
    const invalid3: Result = { tags: null };

    // Object fields CAN accept null
    const valid: Result = { profile: null };

    // Suppress unused variable warnings
    void invalid1;
    void invalid2;
    void invalid3;
    void valid;
  });

  it('should work with complex real-world example', () => {
    type UserForm = {
      firstName: string;
      lastName: string;
      email: string;
      age: number;
      address: {
        street: string;
        city: string;
        zipCode: string;
      };
      hobbies: string[];
      isActive: boolean;
    };

    type FormInput = PartialWithNullableObjects<UserForm>;

    // Primitives: optional but NOT nullable
    // Arrays: optional but NOT nullable
    // Objects: optional AND nullable
    expectTypeOf<FormInput>().toMatchTypeOf<{
      firstName?: string | undefined;
      lastName?: string | undefined;
      email?: string | undefined;
      age?: number | undefined;
      address?:
        | {
            street: string;
            city: string;
            zipCode: string;
          }
        | null
        | undefined;
      hobbies?: string[] | undefined;
      isActive?: boolean | undefined;
    }>();

    // Should accept partial forms during editing
    expectTypeOf<{
      firstName: 'John';
    }>().toMatchTypeOf<FormInput>();

    // Primitives and arrays accept undefined but NOT null
    // Objects accept both
    expectTypeOf<{
      firstName: undefined;
      email: undefined;
      age: undefined;
      isActive: undefined;
      hobbies: undefined;
      address: null;
    }>().toMatchTypeOf<FormInput>();
  });
});

describe('PartialWithAllNullables', () => {
  it('should make all fields optional and nullable', () => {
    type Input = {
      name: string;
      age: number;
      active: boolean;
      tags: string[];
    };

    type Result = PartialWithAllNullables<Input>;

    // All fields: optional AND nullable
    expectTypeOf<Result>().toMatchTypeOf<{
      name?: string | null | undefined;
      age?: number | null | undefined;
      active?: boolean | null | undefined;
      tags?: string[] | null | undefined;
    }>();

    // All fields accept both null and undefined
    expectTypeOf<{ name: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ name: undefined }>().toMatchTypeOf<Result>();
    expectTypeOf<{ age: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ age: undefined }>().toMatchTypeOf<Result>();
    expectTypeOf<{ tags: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ tags: undefined }>().toMatchTypeOf<Result>();
  });

  it('should handle complex types', () => {
    type Input = {
      name: string;
      profile: { bio: string; age: number };
      tags: string[];
    };

    type Result = PartialWithAllNullables<Input>;

    // All fields nullable and optional
    expectTypeOf<Result>().toMatchTypeOf<{
      name?: string | null | undefined;
      profile?: { bio: string; age: number } | null | undefined;
      tags?: string[] | null | undefined;
    }>();

    // All accept null
    expectTypeOf<{ name: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ profile: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ tags: null }>().toMatchTypeOf<Result>();
  });
});

describe('ValidFieldPathsOfType', () => {
  describe('basic type filtering', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().optional(),
      count: z.number().nullable(),
      active: z.boolean(),
    });

    it('should extract string field paths', () => {
      type StringPaths = ValidFieldPathsOfType<typeof schema, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<'name' | 'email'>();
    });

    it('should extract number field paths', () => {
      type NumberPaths = ValidFieldPathsOfType<typeof schema, number>;

      expectTypeOf<NumberPaths>().toEqualTypeOf<'age' | 'count'>();
    });

    it('should extract boolean field paths', () => {
      type BooleanPaths = ValidFieldPathsOfType<typeof schema, boolean>;

      expectTypeOf<BooleanPaths>().toEqualTypeOf<'active'>();
    });
  });

  describe('array type filtering', () => {
    const schema = z.object({
      name: z.string(),
      tags: z.array(z.string()),
      scores: z.array(z.number()),
      items: z.array(z.object({ id: z.number() })),
    });

    it('should extract string array paths', () => {
      type StringArrayPaths = ValidFieldPathsOfType<typeof schema, string[]>;

      expectTypeOf<StringArrayPaths>().toEqualTypeOf<'tags'>();
    });

    it('should extract number array paths', () => {
      type NumberArrayPaths = ValidFieldPathsOfType<typeof schema, number[]>;

      expectTypeOf<NumberArrayPaths>().toEqualTypeOf<'scores'>();
    });

    it('should extract object array paths', () => {
      type ObjectArrayPaths = ValidFieldPathsOfType<
        typeof schema,
        { id: number }[]
      >;

      expectTypeOf<ObjectArrayPaths>().toEqualTypeOf<'items'>();
    });
  });

  describe('enum and literal handling', () => {
    it('should include enum fields when filtering for string (literals extend string)', () => {
      const schema = z.object({
        mode: z.enum(['create', 'edit']),
        name: z.string(),
      });

      // Both 'mode' and 'name' have types that extend string
      type StringPaths = ValidFieldPathsOfType<typeof schema, string>;
      expectTypeOf<StringPaths>().toEqualTypeOf<'mode' | 'name'>();
    });
  });

  describe('edge cases', () => {
    it('should return never for non-matching types', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      type BooleanPaths = ValidFieldPathsOfType<typeof schema, boolean>;

      expectTypeOf<BooleanPaths>().toBeNever();
    });

    it('should handle complex real-world form schema', () => {
      const userFormSchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        age: z.number().min(0),
        tags: z.array(z.string()),
        isActive: z.boolean(),
      });

      type StringPaths = ValidFieldPathsOfType<typeof userFormSchema, string>;
      type NumberPaths = ValidFieldPathsOfType<typeof userFormSchema, number>;

      expectTypeOf<StringPaths>().toEqualTypeOf<
        | 'firstName'
        | 'lastName'
        | 'email'
        | 'tags.0'
        | 'tags.1'
        | 'tags.2'
        | 'tags.4'
        | 'tags.3'
        | 'tags.5'
        | 'tags.6'
        | 'tags.7'
        | 'tags.8'
        | 'tags.9'
        | `tags.1${number}`
        | `tags.2${number}`
        | `tags.4${number}`
        | `tags.3${number}`
        | `tags.5${number}`
        | `tags.6${number}`
        | `tags.7${number}`
        | `tags.8${number}`
        | `tags.9${number}`
      >();
      expectTypeOf<NumberPaths>().toEqualTypeOf<'age'>();
    });
  });
});
