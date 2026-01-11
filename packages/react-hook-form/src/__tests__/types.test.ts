import { describe, expectTypeOf, it } from 'vitest';
import type {
  DeepPartialWithAllNullables,
  DeepPartialWithNullableObjects,
} from '../types';

describe('DeepPartialWithNullableObjects', () => {
  it('should make properties optional with different nullable behavior for primitives vs objects', () => {
    type Input = {
      name: string;
      age: number;
      active: boolean;
    };

    type Result = DeepPartialWithNullableObjects<Input>;

    // All are primitives: optional but NOT nullable
    expectTypeOf<Result>().toExtend<{
      name?: string | undefined;
      age?: number | undefined;
      active?: boolean | undefined;
    }>();

    // Should accept objects with missing properties
    expectTypeOf<Record<string, never>>().toExtend<Result>();
    expectTypeOf<{ name: 'test' }>().toExtend<Result>();

    // Primitives accept undefined but NOT null
    expectTypeOf<{ name: undefined }>().toExtend<Result>();
    expectTypeOf<{ age: undefined }>().toExtend<Result>();
    expectTypeOf<{ active: undefined }>().toExtend<Result>();
  });

  it('should preserve existing optional properties', () => {
    type Input = {
      required: string;
      optional?: number;
    };

    type Result = DeepPartialWithNullableObjects<Input>;

    // Both are primitives: optional but not nullable
    expectTypeOf<Result>().toExtend<{
      required?: string | undefined;
      optional?: number | undefined;
    }>();
  });

  it('should handle already nullable properties', () => {
    type Input = {
      nullableString: string | null;
      nullableNumber: number | null;
    };

    type Result = DeepPartialWithNullableObjects<Input>;

    // Union types with null don't extend object, so treated as primitives
    // Preserves the null in the union, just adds optional and undefined
    expectTypeOf<Result>().toExtend<{
      nullableString?: string | null | undefined;
      nullableNumber?: number | null | undefined;
    }>();
  });

  it('should handle nested objects recursively', () => {
    type Input = {
      user: {
        name: string;
        email: string;
      };
    };

    type Result = DeepPartialWithNullableObjects<Input>;

    // Nested object becomes optional and nullable
    // AND its properties are recursively transformed (now optional)
    expectTypeOf<Result>().toExtend<{
      user?:
        | {
            name?: string;
            email?: string;
          }
        | null
        | undefined;
    }>();

    // Should accept missing nested object
    expectTypeOf<Record<string, never>>().toExtend<Result>();
    expectTypeOf<{ user: null }>().toExtend<Result>();
    expectTypeOf<{ user: undefined }>().toExtend<Result>();

    // Should accept nested object with missing properties (recursive)
    expectTypeOf<{ user: { name: 'test' } }>().toExtend<Result>();
    // biome-ignore lint/complexity/noBannedTypes: for testing
    expectTypeOf<{ user: {} }>().toExtend<Result>();
  });

  it('should handle arrays', () => {
    type Input = {
      tags: string[];
      scores: number[];
    };

    type Result = DeepPartialWithNullableObjects<Input>;

    // Arrays: optional but NOT nullable
    expectTypeOf<Result>().toExtend<{
      tags?: string[] | undefined;
      scores?: number[] | undefined;
    }>();

    // Arrays accept undefined but NOT null
    expectTypeOf<{ tags: undefined }>().toExtend<Result>();
    expectTypeOf<{ scores: undefined }>().toExtend<Result>();
  });

  it('should handle union types', () => {
    type Input = {
      status: 'active' | 'inactive';
      value: string | number;
    };

    type Result = DeepPartialWithNullableObjects<Input>;

    // Union types of primitives don't extend object: optional but NOT nullable
    expectTypeOf<Result>().toExtend<{
      status?: 'active' | 'inactive' | undefined;
      value?: string | number | undefined;
    }>();
  });

  it('should handle Date and other built-in types', () => {
    type Input = {
      createdAt: Date;
      pattern: RegExp;
    };

    type Result = DeepPartialWithNullableObjects<Input>;

    expectTypeOf<Result>().toExtend<{
      createdAt?: Date | null | undefined;
      pattern?: RegExp | null | undefined;
    }>();
  });

  it('should handle empty objects', () => {
    // biome-ignore lint/complexity/noBannedTypes: Testing empty object type
    type Input = {};

    type Result = DeepPartialWithNullableObjects<Input>;

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

    type Result = DeepPartialWithNullableObjects<Input>;

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

    type FormInput = DeepPartialWithNullableObjects<UserForm>;

    // Primitives: optional but NOT nullable
    // Arrays: optional but NOT nullable
    // Objects: optional, nullable, AND recursively transformed
    expectTypeOf<FormInput>().toExtend<{
      firstName?: string | undefined;
      lastName?: string | undefined;
      email?: string | undefined;
      age?: number | undefined;
      address?:
        | {
            street?: string;
            city?: string;
            zipCode?: string;
          }
        | null
        | undefined;
      hobbies?: string[] | undefined;
      isActive?: boolean | undefined;
    }>();

    // Should accept partial forms during editing
    expectTypeOf<{
      firstName: 'John';
    }>().toExtend<FormInput>();

    // Primitives and arrays accept undefined but NOT null
    // Objects accept both
    expectTypeOf<{
      firstName: undefined;
      email: undefined;
      age: undefined;
      isActive: undefined;
      hobbies: undefined;
      address: null;
    }>().toExtend<FormInput>();

    // Nested object properties are also optional (recursive transformation)
    expectTypeOf<{
      address: { street: 'Main St' };
    }>().toExtend<FormInput>();
  });
});

describe('DeepPartialWithAllNullables', () => {
  it('should make all fields optional and nullable', () => {
    type Input = {
      name: string;
      age: number;
      active: boolean;
      tags: string[];
    };

    type Result = DeepPartialWithAllNullables<Input>;

    // All fields: optional AND nullable
    expectTypeOf<Result>().toExtend<{
      name?: string | null | undefined;
      age?: number | null | undefined;
      active?: boolean | null | undefined;
      tags?: string[] | null | undefined;
    }>();

    // All fields accept both null and undefined
    expectTypeOf<{ name: null }>().toExtend<Result>();
    expectTypeOf<{ name: undefined }>().toExtend<Result>();
    expectTypeOf<{ age: null }>().toExtend<Result>();
    expectTypeOf<{ age: undefined }>().toExtend<Result>();
    expectTypeOf<{ tags: null }>().toExtend<Result>();
    expectTypeOf<{ tags: undefined }>().toExtend<Result>();
  });

  it('should handle complex types with recursive transformation', () => {
    type Input = {
      name: string;
      profile: { bio: string; age: number };
      tags: string[];
    };

    type Result = DeepPartialWithAllNullables<Input>;

    // All fields nullable and optional
    // Nested objects are recursively transformed
    expectTypeOf<Result>().toExtend<{
      name?: string | null | undefined;
      profile?: { bio?: string | null; age?: number | null } | null | undefined;
      tags?: string[] | null | undefined;
    }>();

    // All accept null
    expectTypeOf<{ name: null }>().toExtend<Result>();
    expectTypeOf<{ profile: null }>().toExtend<Result>();
    expectTypeOf<{ tags: null }>().toExtend<Result>();

    // Nested object properties are also optional and nullable (recursive)
    expectTypeOf<{ profile: { bio: 'hello' } }>().toExtend<Result>();
    expectTypeOf<{ profile: { bio: null } }>().toExtend<Result>();
    // biome-ignore lint/complexity/noBannedTypes: for testing
    expectTypeOf<{ profile: {} }>().toExtend<Result>();
  });
});
