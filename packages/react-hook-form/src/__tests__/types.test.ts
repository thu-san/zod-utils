import { describe, expectTypeOf, it } from 'vitest';
import type { MakeOptionalAndNullable } from '../types';

describe('MakeOptionalAndNullable', () => {
  it('should make all properties optional and accept null/undefined', () => {
    type Input = {
      name: string;
      age: number;
      active: boolean;
    };

    type Result = MakeOptionalAndNullable<Input>;

    // All properties should be optional
    expectTypeOf<Result>().toMatchTypeOf<{
      name?: string | null | undefined;
      age?: number | null | undefined;
      active?: boolean | null | undefined;
    }>();

    // Should accept objects with missing properties
    expectTypeOf<Record<string, never>>().toMatchTypeOf<Result>();
    expectTypeOf<{ name: 'test' }>().toMatchTypeOf<Result>();

    // Should accept null and undefined values
    expectTypeOf<{ name: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ name: undefined }>().toMatchTypeOf<Result>();
    expectTypeOf<{ age: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ age: undefined }>().toMatchTypeOf<Result>();
  });

  it('should preserve existing optional properties', () => {
    type Input = {
      required: string;
      optional?: number;
    };

    type Result = MakeOptionalAndNullable<Input>;

    // Both should be optional and accept null/undefined
    expectTypeOf<Result>().toMatchTypeOf<{
      required?: string | null | undefined;
      optional?: number | null | undefined;
    }>();
  });

  it('should handle already nullable properties', () => {
    type Input = {
      nullableString: string | null;
      nullableNumber: number | null;
    };

    type Result = MakeOptionalAndNullable<Input>;

    // Should add optional and undefined
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

    type Result = MakeOptionalAndNullable<Input>;

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

    type Result = MakeOptionalAndNullable<Input>;

    expectTypeOf<Result>().toMatchTypeOf<{
      tags?: string[] | null | undefined;
      scores?: number[] | null | undefined;
    }>();

    // Should accept null/undefined arrays
    expectTypeOf<{ tags: null }>().toMatchTypeOf<Result>();
    expectTypeOf<{ scores: undefined }>().toMatchTypeOf<Result>();
  });

  it('should handle union types', () => {
    type Input = {
      status: 'active' | 'inactive';
      value: string | number;
    };

    type Result = MakeOptionalAndNullable<Input>;

    expectTypeOf<Result>().toMatchTypeOf<{
      status?: 'active' | 'inactive' | null | undefined;
      value?: string | number | null | undefined;
    }>();
  });

  it('should handle Date and other built-in types', () => {
    type Input = {
      createdAt: Date;
      pattern: RegExp;
    };

    type Result = MakeOptionalAndNullable<Input>;

    expectTypeOf<Result>().toMatchTypeOf<{
      createdAt?: Date | null | undefined;
      pattern?: RegExp | null | undefined;
    }>();
  });

  it('should handle empty objects', () => {
    // biome-ignore lint/complexity/noBannedTypes: Testing empty object type
    type Input = {};

    type Result = MakeOptionalAndNullable<Input>;

    // biome-ignore lint/complexity/noBannedTypes: Testing empty object type
    expectTypeOf<Result>().toEqualTypeOf<{}>();
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

    type FormInput = MakeOptionalAndNullable<UserForm>;

    // All fields should be optional and nullable for form input
    expectTypeOf<FormInput>().toMatchTypeOf<{
      firstName?: string | null | undefined;
      lastName?: string | null | undefined;
      email?: string | null | undefined;
      age?: number | null | undefined;
      address?:
        | {
            street: string;
            city: string;
            zipCode: string;
          }
        | null
        | undefined;
      hobbies?: string[] | null | undefined;
      isActive?: boolean | null | undefined;
    }>();

    // Should accept partial forms during editing
    expectTypeOf<{
      firstName: 'John';
    }>().toMatchTypeOf<FormInput>();

    expectTypeOf<{
      firstName: null;
      email: undefined;
    }>().toMatchTypeOf<FormInput>();
  });
});
