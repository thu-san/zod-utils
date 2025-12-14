import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import type {
  DiscriminatedInput,
  FieldSelector,
  Paths,
  ValidPaths,
} from '../types';

describe('Paths', () => {
  describe('basic paths without filtering', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      active: z.boolean(),
    });
    type Schema = z.input<typeof schema>;

    it('should extract all paths from simple object', () => {
      type AllPaths = Paths<Schema>;

      expectTypeOf<AllPaths>().toEqualTypeOf<'name' | 'age' | 'active'>();
    });
  });

  describe('nested object paths', () => {
    type NestedSchema = {
      user: {
        name: string;
        profile: {
          bio: string;
          avatar: string;
        };
      };
      count: number;
    };

    it('should extract nested paths', () => {
      type AllPaths = Paths<NestedSchema>;

      expectTypeOf<AllPaths>().toEqualTypeOf<
        | 'user'
        | 'user.name'
        | 'user.profile'
        | 'user.profile.bio'
        | 'user.profile.avatar'
        | 'count'
      >();
    });
  });

  describe('array paths', () => {
    type ArraySchema = {
      tags: string[];
      items: { id: number; name: string }[];
    };

    it('should extract array paths with numeric indices', () => {
      type AllPaths = Paths<ArraySchema>;

      // Should include array root and indexed paths
      expectTypeOf<'tags'>().toExtend<AllPaths>();
      expectTypeOf<'tags.0'>().toExtend<AllPaths>();
      expectTypeOf<'tags.1'>().toExtend<AllPaths>();
      expectTypeOf<'items'>().toExtend<AllPaths>();
      expectTypeOf<'items.0'>().toExtend<AllPaths>();
      expectTypeOf<'items.0.id'>().toExtend<AllPaths>();
      expectTypeOf<'items.0.name'>().toExtend<AllPaths>();
    });
  });
});

describe('Paths with FilterType', () => {
  describe('basic type filtering', () => {
    type Schema = {
      name: string;
      age: number;
      email: string | undefined;
      count: number | null;
      active: boolean;
    };

    it('should extract string field paths', () => {
      type StringPaths = Paths<Schema, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<'name'>();
    });

    it('should extract number field paths', () => {
      type NumberPaths = Paths<Schema, number>;

      expectTypeOf<NumberPaths>().toEqualTypeOf<'age'>();
    });

    it('should extract boolean field paths', () => {
      type BooleanPaths = Paths<Schema, boolean>;

      expectTypeOf<BooleanPaths>().toEqualTypeOf<'active'>();
    });

    it('should extract nullable number paths with non-strict mode', () => {
      // In non-strict mode, fields where any part of union extends filter are included
      type NumberPaths = Paths<Schema, number, false>;

      // count (number | null) should be included since number extends number
      expectTypeOf<'age'>().toExtend<NumberPaths>();
      expectTypeOf<'count'>().toExtend<NumberPaths>();
    });

    it('should extract optional string paths with non-strict mode', () => {
      type StringPaths = Paths<Schema, string, false>;

      // email (string | undefined) should be included since string extends string
      expectTypeOf<'name'>().toExtend<StringPaths>();
      expectTypeOf<'email'>().toExtend<StringPaths>();
    });
  });

  describe('array type filtering', () => {
    type Schema = {
      name: string;
      tags: string[];
      scores: number[];
      items: { id: number }[];
    };

    it('should extract string array paths', () => {
      type StringArrayPaths = Paths<Schema, string[]>;

      expectTypeOf<StringArrayPaths>().toEqualTypeOf<'tags'>();
    });

    it('should extract number array paths', () => {
      type NumberArrayPaths = Paths<Schema, number[]>;

      expectTypeOf<NumberArrayPaths>().toEqualTypeOf<'scores'>();
    });

    it('should extract object array paths', () => {
      type ObjectArrayPaths = Paths<Schema, { id: number }[]>;

      expectTypeOf<ObjectArrayPaths>().toEqualTypeOf<'items'>();
    });
  });

  describe('filter by object type', () => {
    type Schema = {
      name: string;
      profile: { bio: string; age: number };
      settings: { theme: string };
      count: number;
    };

    it('should extract paths matching specific object type', () => {
      type ProfilePaths = Paths<Schema, { bio: string; age: number }>;

      expectTypeOf<ProfilePaths>().toEqualTypeOf<'profile'>();
    });

    it('should extract paths matching another object type', () => {
      type SettingsPaths = Paths<Schema, { theme: string }>;

      expectTypeOf<SettingsPaths>().toEqualTypeOf<'settings'>();
    });
  });

  describe('filter by array of primitive', () => {
    type Schema = {
      name: string;
      tags: string[];
      scores: number[];
      flags: boolean[];
    };

    it('should extract string array paths', () => {
      type StringArrayPaths = Paths<Schema, string[]>;

      expectTypeOf<StringArrayPaths>().toEqualTypeOf<'tags'>();
    });

    it('should extract number array paths', () => {
      type NumberArrayPaths = Paths<Schema, number[]>;

      expectTypeOf<NumberArrayPaths>().toEqualTypeOf<'scores'>();
    });

    it('should extract boolean array paths', () => {
      type BooleanArrayPaths = Paths<Schema, boolean[]>;

      expectTypeOf<BooleanArrayPaths>().toEqualTypeOf<'flags'>();
    });
  });

  describe('filter by array of object', () => {
    type Schema = {
      name: string;
      users: { id: number; name: string }[];
      products: { sku: string; price: number }[];
    };

    it('should extract user array paths', () => {
      type UserArrayPaths = Paths<Schema, { id: number; name: string }[]>;

      expectTypeOf<UserArrayPaths>().toEqualTypeOf<'users'>();
    });

    it('should extract product array paths', () => {
      type ProductArrayPaths = Paths<Schema, { sku: string; price: number }[]>;

      expectTypeOf<ProductArrayPaths>().toEqualTypeOf<'products'>();
    });
  });

  describe('filter by array of unknown or any', () => {
    type Schema = {
      name: string;
      tags: string[];
      items: unknown[];
      mixed: (string | number)[];
    };

    it('should include unknown array in unknown[] filter', () => {
      type UnknownArrayPaths = Paths<Schema, unknown[]>;

      // unknown[] is a supertype, so it matches all arrays
      expectTypeOf<'items'>().toExtend<UnknownArrayPaths>();
      expectTypeOf<'tags'>().toExtend<UnknownArrayPaths>();
      expectTypeOf<'mixed'>().toExtend<UnknownArrayPaths>();
    });

    it('should match arrays that extend union array type', () => {
      type UnionArrayPaths = Paths<Schema, (string | number)[]>;

      // string[] extends (string | number)[], so 'tags' also matches
      expectTypeOf<'mixed'>().toExtend<UnionArrayPaths>();
      expectTypeOf<'tags'>().toExtend<UnionArrayPaths>();
    });
  });

  describe('nested path filtering', () => {
    type Schema = {
      name: string;
      profile: {
        bio: string;
        age: number;
        settings: {
          theme: string;
        };
      };
      count: number;
    };

    it('should extract all string paths including nested', () => {
      type StringPaths = Paths<Schema, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<
        'name' | 'profile.bio' | 'profile.settings.theme'
      >();
    });

    it('should extract all number paths including nested', () => {
      type NumberPaths = Paths<Schema, number>;

      expectTypeOf<NumberPaths>().toEqualTypeOf<'count' | 'profile.age'>();
    });
  });

  describe('edge cases', () => {
    it('should return never for non-matching types', () => {
      type Schema = {
        name: string;
        age: number;
      };

      type BooleanPaths = Paths<Schema, boolean>;

      expectTypeOf<BooleanPaths>().toBeNever();
    });

    it('should handle literal types in strict mode', () => {
      type Schema = {
        status: 'active';
        mode: 'edit';
        count: number;
      };

      type ActivePaths = Paths<Schema, 'active'>;

      expectTypeOf<ActivePaths>().toEqualTypeOf<'status'>();
    });

    it('should handle literal types in non-strict mode (extends string)', () => {
      type Schema = {
        status: 'active';
        mode: 'edit';
        name: string;
      };

      // In non-strict mode, literals extend string
      type StringPaths = Paths<Schema, string, false>;

      expectTypeOf<StringPaths>().toEqualTypeOf<'status' | 'mode' | 'name'>();
    });
  });
});

describe('ValidPaths', () => {
  describe('with regular schemas', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().optional(),
      count: z.number().nullable(),
      active: z.boolean(),
    });

    it('should extract all paths without filter', () => {
      type AllPaths = ValidPaths<typeof schema>;

      expectTypeOf<'name'>().toExtend<AllPaths>();
      expectTypeOf<'age'>().toExtend<AllPaths>();
      expectTypeOf<'email'>().toExtend<AllPaths>();
      expectTypeOf<'count'>().toExtend<AllPaths>();
      expectTypeOf<'active'>().toExtend<AllPaths>();
    });

    it('should extract string paths with filter', () => {
      type StringPaths = ValidPaths<typeof schema, never, never, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<'name'>();
    });

    it('should extract number paths with filter', () => {
      type NumberPaths = ValidPaths<typeof schema, never, never, number>;

      expectTypeOf<NumberPaths>().toEqualTypeOf<'age'>();
    });

    it('should extract string | undefined paths with non-strict', () => {
      type StringPaths = ValidPaths<typeof schema, never, never, string, false>;

      // email (string | undefined) should be included in non-strict mode
      expectTypeOf<'name'>().toExtend<StringPaths>();
      expectTypeOf<'email'>().toExtend<StringPaths>();
    });

    it('should extract number | null paths with non-strict', () => {
      type NumberPaths = ValidPaths<typeof schema, never, never, number, false>;

      // count (number | null) should be included in non-strict mode
      expectTypeOf<'age'>().toExtend<NumberPaths>();
      expectTypeOf<'count'>().toExtend<NumberPaths>();
    });
  });

  describe('with discriminated unions', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        name: z.string(),
        age: z.number(),
      }),
      z.object({ mode: z.literal('edit'), id: z.number(), title: z.string() }),
    ]);

    it('should extract paths for create variant', () => {
      type CreatePaths = ValidPaths<typeof schema, 'mode', 'create'>;

      expectTypeOf<CreatePaths>().toEqualTypeOf<'mode' | 'name' | 'age'>();
    });

    it('should extract paths for edit variant', () => {
      type EditPaths = ValidPaths<typeof schema, 'mode', 'edit'>;

      expectTypeOf<EditPaths>().toEqualTypeOf<'mode' | 'id' | 'title'>();
    });

    it('should extract string paths for create variant', () => {
      type CreateStringPaths = ValidPaths<
        typeof schema,
        'mode',
        'create',
        string,
        false
      >;

      // mode is literal 'create' which extends string in non-strict mode
      expectTypeOf<'mode'>().toExtend<CreateStringPaths>();
      expectTypeOf<'name'>().toExtend<CreateStringPaths>();
    });

    it('should extract number paths for edit variant', () => {
      type EditNumberPaths = ValidPaths<typeof schema, 'mode', 'edit', number>;

      expectTypeOf<EditNumberPaths>().toEqualTypeOf<'id'>();
    });
  });

  describe('discriminated union with nested object only', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        profile: z.object({
          name: z.string(),
          age: z.number(),
        }),
      }),
      z.object({
        mode: z.literal('edit'),
        user: z.object({
          id: z.number(),
          email: z.string(),
        }),
      }),
    ]);

    it('should extract paths from nested object in create variant', () => {
      type StringPaths = ValidPaths<typeof schema, 'mode', 'create', string>;
      type NumberPaths = ValidPaths<typeof schema, 'mode', 'create', number>;

      expectTypeOf<'profile.name'>().toExtend<StringPaths>();
      expectTypeOf<'profile.age'>().toExtend<NumberPaths>();
    });

    it('should extract paths from nested object in edit variant', () => {
      type StringPaths = ValidPaths<typeof schema, 'mode', 'edit', string>;
      type NumberPaths = ValidPaths<typeof schema, 'mode', 'edit', number>;

      expectTypeOf<'user.email'>().toExtend<StringPaths>();
      expectTypeOf<'user.id'>().toExtend<NumberPaths>();
    });
  });

  describe('discriminated union with array only', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        tags: z.array(z.string()),
      }),
      z.object({
        mode: z.literal('edit'),
        items: z.array(
          z.object({
            id: z.number(),
            label: z.string(),
          }),
        ),
      }),
    ]);

    it('should extract paths from primitive array in create variant', () => {
      type StringPaths = ValidPaths<typeof schema, 'mode', 'create', string>;

      expectTypeOf<'tags.0'>().toExtend<StringPaths>();
    });

    it('should extract paths from object array in edit variant', () => {
      type NumberPaths = ValidPaths<typeof schema, 'mode', 'edit', number>;
      type StringPaths = ValidPaths<typeof schema, 'mode', 'edit', string>;

      expectTypeOf<'items.0.id'>().toExtend<NumberPaths>();
      expectTypeOf<'items.0.label'>().toExtend<StringPaths>();
    });
  });

  describe('with nested object only', () => {
    const schema = z.object({
      profile: z.object({
        name: z.string(),
        age: z.number(),
      }),
    });

    it('should extract paths from nested object', () => {
      type StringPaths = ValidPaths<typeof schema, never, never, string>;
      type NumberPaths = ValidPaths<typeof schema, never, never, number>;

      expectTypeOf<'profile.name'>().toExtend<StringPaths>();
      expectTypeOf<'profile.age'>().toExtend<NumberPaths>();
    });
  });

  describe('with array only', () => {
    const schemaWithPrimitiveArray = z.object({
      tags: z.array(z.string()),
    });

    const schemaWithObjectArray = z.object({
      items: z.array(
        z.object({
          id: z.number(),
          label: z.string(),
        }),
      ),
    });

    it('should extract paths from primitive array', () => {
      type StringPaths = ValidPaths<
        typeof schemaWithPrimitiveArray,
        never,
        never,
        string
      >;

      expectTypeOf<'tags.0'>().toExtend<StringPaths>();
    });

    it('should extract paths from object array', () => {
      type NumberPaths = ValidPaths<
        typeof schemaWithObjectArray,
        never,
        never,
        number
      >;
      type StringPaths = ValidPaths<
        typeof schemaWithObjectArray,
        never,
        never,
        string
      >;

      expectTypeOf<'items.0.id'>().toExtend<NumberPaths>();
      expectTypeOf<'items.0.label'>().toExtend<StringPaths>();
    });
  });

  describe('with nested objects and arrays', () => {
    const schema = z.object({
      profile: z.object({
        name: z.string(),
        age: z.number(),
      }),
      tags: z.array(z.string()),
      items: z.array(
        z.object({
          id: z.number(),
          label: z.string(),
        }),
      ),
    });

    it('should extract string paths including nested object', () => {
      type StringPaths = ValidPaths<typeof schema, never, never, string>;

      expectTypeOf<'profile.name'>().toExtend<StringPaths>();
    });

    it('should extract number paths including nested object', () => {
      type NumberPaths = ValidPaths<typeof schema, never, never, number>;

      expectTypeOf<'profile.age'>().toExtend<NumberPaths>();
    });

    it('should extract paths from primitive array', () => {
      type StringPaths = ValidPaths<typeof schema, never, never, string>;

      expectTypeOf<'tags.0'>().toExtend<StringPaths>();
    });

    it('should extract paths from object array', () => {
      type NumberPaths = ValidPaths<typeof schema, never, never, number>;
      type StringPaths = ValidPaths<typeof schema, never, never, string>;

      expectTypeOf<'items.0.id'>().toExtend<NumberPaths>();
      expectTypeOf<'items.0.label'>().toExtend<StringPaths>();
    });
  });
});

describe('DiscriminatedInput', () => {
  describe('with discriminated union', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        name: z.string(),
        age: z.number().optional(),
      }),
      z.object({
        mode: z.literal('edit'),
        id: z.number(),
        title: z.string().optional(),
      }),
    ]);

    it('should extract create variant input', () => {
      type CreateInput = DiscriminatedInput<typeof schema, 'mode', 'create'>;

      expectTypeOf<CreateInput>().toEqualTypeOf<{
        mode: 'create';
        name: string;
        age?: number;
      }>();
    });

    it('should extract edit variant input', () => {
      type EditInput = DiscriminatedInput<typeof schema, 'mode', 'edit'>;

      expectTypeOf<EditInput>().toEqualTypeOf<{
        mode: 'edit';
        id: number;
        title?: string;
      }>();
    });
  });

  describe('with regular schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should return full input type', () => {
      type Input = DiscriminatedInput<typeof schema, never, never>;

      expectTypeOf<Input>().toEqualTypeOf<{
        name: string;
        age: number;
      }>();
    });
  });
});

describe('FieldSelector', () => {
  describe('with regular schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should create params without discriminator', () => {
      type Params = FieldSelector<typeof schema, 'name'>;

      expectTypeOf<Params>().toEqualTypeOf<{
        schema: typeof schema;
        name: 'name';
        discriminator?: undefined;
      }>();
    });

    it('should infer valid name from schema', () => {
      type Params = FieldSelector<typeof schema, 'age'>;

      expectTypeOf<Params>().toExtend<{
        schema: typeof schema;
        name: 'age';
      }>();
    });
  });

  describe('with discriminated union', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    it('should require discriminator for discriminated union', () => {
      type Params = FieldSelector<typeof schema, 'name', 'mode', 'create'>;

      expectTypeOf<Params>().toExtend<{
        schema: typeof schema;
        name: 'name';
        discriminator: {
          key: 'mode';
          value: 'create';
        };
      }>();
    });
  });
});

describe('complex real-world examples', () => {
  const userFormSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    age: z.number().min(0),
    score: z.number().optional(),
    tags: z.array(z.string()),
    addresses: z.array(
      z.object({
        street: z.string(),
        city: z.string(),
        zip: z.string(),
      }),
    ),
    profile: z.object({
      bio: z.string(),
      website: z.url().optional(),
    }),
    isActive: z.boolean(),
  });

  it('should extract all number paths', () => {
    type NumberPaths = ValidPaths<typeof userFormSchema, never, never, number>;

    expectTypeOf<NumberPaths>().toEqualTypeOf<'age'>();
  });

  it('should extract number paths with non-strict (includes optional)', () => {
    type NumberPaths = ValidPaths<
      typeof userFormSchema,
      never,
      never,
      number,
      false
    >;

    // score (number | undefined) should be included in non-strict mode
    expectTypeOf<'age'>().toExtend<NumberPaths>();
    expectTypeOf<'score'>().toExtend<NumberPaths>();
  });

  it('should extract string array paths', () => {
    type StringArrayPaths = ValidPaths<
      typeof userFormSchema,
      never,
      never,
      string[]
    >;

    expectTypeOf<StringArrayPaths>().toEqualTypeOf<'tags'>();
  });

  it('should extract address array paths', () => {
    type AddressPaths = ValidPaths<
      typeof userFormSchema,
      never,
      never,
      { street: string; city: string; zip: string }[]
    >;

    expectTypeOf<AddressPaths>().toEqualTypeOf<'addresses'>();
  });

  it('should extract boolean paths', () => {
    type BooleanPaths = ValidPaths<
      typeof userFormSchema,
      never,
      never,
      boolean
    >;

    expectTypeOf<BooleanPaths>().toEqualTypeOf<'isActive'>();
  });
});

describe('Strict vs Non-Strict mode', () => {
  type Schema = {
    required: string;
    optional: string | undefined;
    nullable: string | null;
    nullish: string | null | undefined;
  };

  describe('strict mode (default)', () => {
    it('should match exact string type', () => {
      type StringPaths = Paths<Schema, string>;

      // Only 'required' has exact type 'string'
      expectTypeOf<'required'>().toExtend<StringPaths>();
    });

    it('should match string | undefined filter', () => {
      type OptionalPaths = Paths<Schema, string | undefined>;

      // 'optional' matches, and 'required' also matches since string extends string | undefined
      expectTypeOf<'optional'>().toExtend<OptionalPaths>();
      expectTypeOf<'required'>().toExtend<OptionalPaths>();
    });
  });

  describe('non-strict mode', () => {
    it('should match types where any part extends string', () => {
      type StringPaths = Paths<Schema, string, false>;

      // All fields have string as part of their union, so all match
      expectTypeOf<'required'>().toExtend<StringPaths>();
      expectTypeOf<'optional'>().toExtend<StringPaths>();
      expectTypeOf<'nullable'>().toExtend<StringPaths>();
      expectTypeOf<'nullish'>().toExtend<StringPaths>();
    });
  });
});

describe('enum and literal handling', () => {
  describe('with enums', () => {
    const schema = z.object({
      status: z.enum(['active', 'inactive', 'pending']),
      name: z.string(),
      count: z.number(),
    });

    it('should filter for specific enum type in strict mode', () => {
      type EnumPaths = ValidPaths<
        typeof schema,
        never,
        never,
        'active' | 'inactive' | 'pending'
      >;

      expectTypeOf<EnumPaths>().toEqualTypeOf<'status'>();
    });

    it('should include enum in string filter in non-strict mode', () => {
      // Enum values extend string
      type StringPaths = ValidPaths<typeof schema, never, never, string, false>;

      // Both enum and string fields should be included
      expectTypeOf<'status'>().toExtend<StringPaths>();
      expectTypeOf<'name'>().toExtend<StringPaths>();
    });
  });

  describe('with literals', () => {
    const schema = z.object({
      type: z.literal('user'),
      mode: z.literal('admin'),
      name: z.string(),
    });

    it('should filter for specific literal', () => {
      type UserPaths = ValidPaths<typeof schema, never, never, 'user'>;

      expectTypeOf<UserPaths>().toEqualTypeOf<'type'>();
    });

    it('should include literals in string filter in non-strict mode', () => {
      type StringPaths = ValidPaths<typeof schema, never, never, string, false>;

      // Literal values extend string, so all should be included
      expectTypeOf<'type'>().toExtend<StringPaths>();
      expectTypeOf<'mode'>().toExtend<StringPaths>();
      expectTypeOf<'name'>().toExtend<StringPaths>();
    });
  });
});

describe('edge cases for discriminated unions', () => {
  describe('without discriminator specified', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    it('should return only common paths when no discriminator provided', () => {
      type AllPaths = ValidPaths<typeof schema>;

      // Only 'mode' is common to all variants
      expectTypeOf<AllPaths>().toEqualTypeOf<'mode'>();
    });
  });

  describe('empty schema', () => {
    it('should return never for empty object', () => {
      // biome-ignore lint/complexity/noBannedTypes: for testing
      type EmptyPaths = Paths<{}>;

      expectTypeOf<EmptyPaths>().toBeNever();
    });
  });

  describe('schema with only discriminator', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('a') }),
      z.object({ type: z.literal('b') }),
    ]);

    it('should return only discriminator path', () => {
      type APaths = ValidPaths<typeof schema, 'type', 'a'>;

      expectTypeOf<APaths>().toEqualTypeOf<'type'>();
    });
  });

  describe('discriminated union with default discriminator key', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create').default('create'),
        name: z.string(),
        profile: z.object({ bio: z.string(), avatar: z.string().optional() }),
        tags: z.array(z.string()),
      }),
      z.object({
        mode: z.literal('edit'),
        id: z.number(),
        history: z.array(z.object({ date: z.string(), action: z.string() })),
      }),
    ]);

    it('should include nested object paths for create variant', () => {
      type CreatePaths = ValidPaths<typeof schema, 'mode', 'create'>;

      expectTypeOf<'mode'>().toExtend<CreatePaths>();
      expectTypeOf<'name'>().toExtend<CreatePaths>();
      expectTypeOf<'profile'>().toExtend<CreatePaths>();
      expectTypeOf<'profile.bio'>().toExtend<CreatePaths>();
      expectTypeOf<'profile.avatar'>().toExtend<CreatePaths>();
      expectTypeOf<'tags'>().toExtend<CreatePaths>();
      expectTypeOf<`tags.${number}`>().toExtend<CreatePaths>();
    });

    it('should include nested array object paths for edit variant', () => {
      type EditPaths = ValidPaths<typeof schema, 'mode', 'edit'>;

      expectTypeOf<'mode'>().toExtend<EditPaths>();
      expectTypeOf<'id'>().toExtend<EditPaths>();
      expectTypeOf<'history'>().toExtend<EditPaths>();
      expectTypeOf<`history.${number}`>().toExtend<EditPaths>();
      expectTypeOf<`history.${number}.date`>().toExtend<EditPaths>();
      expectTypeOf<`history.${number}.action`>().toExtend<EditPaths>();
    });

    it('should not include paths from other variant', () => {
      type CreatePaths = ValidPaths<typeof schema, 'mode', 'create'>;
      type EditPaths = ValidPaths<typeof schema, 'mode', 'edit'>;

      // 'name' should not be in edit paths
      expectTypeOf<'name'>().not.toExtend<EditPaths>();
      // 'id' should not be in create paths
      expectTypeOf<'id'>().not.toExtend<CreatePaths>();
    });
  });

  describe('discriminated union without default discriminator key', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('user'),
        data: z.object({ name: z.string(), age: z.number() }),
        roles: z.array(z.string()),
      }),
      z.object({
        type: z.literal('admin'),
        permissions: z.array(
          z.object({ resource: z.string(), level: z.number() }),
        ),
      }),
    ]);

    it('should include nested paths for user variant', () => {
      type UserPaths = ValidPaths<typeof schema, 'type', 'user'>;

      expectTypeOf<'type'>().toExtend<UserPaths>();
      expectTypeOf<'data'>().toExtend<UserPaths>();
      expectTypeOf<'data.name'>().toExtend<UserPaths>();
      expectTypeOf<'data.age'>().toExtend<UserPaths>();
      expectTypeOf<'roles'>().toExtend<UserPaths>();
      expectTypeOf<`roles.${number}`>().toExtend<UserPaths>();
    });

    it('should include nested array object paths for admin variant', () => {
      type AdminPaths = ValidPaths<typeof schema, 'type', 'admin'>;

      expectTypeOf<'type'>().toExtend<AdminPaths>();
      expectTypeOf<'permissions'>().toExtend<AdminPaths>();
      expectTypeOf<`permissions.${number}`>().toExtend<AdminPaths>();
      expectTypeOf<`permissions.${number}.resource`>().toExtend<AdminPaths>();
      expectTypeOf<`permissions.${number}.level`>().toExtend<AdminPaths>();
    });

    it('should filter by type within nested objects', () => {
      type UserStringPaths = ValidPaths<typeof schema, 'type', 'user', string>;

      expectTypeOf<'data.name'>().toExtend<UserStringPaths>();
      expectTypeOf<`roles.${number}`>().toExtend<UserStringPaths>();
      // number field should not be included
      expectTypeOf<'data.age'>().not.toExtend<UserStringPaths>();
    });

    it('should filter by type within nested array objects', () => {
      type AdminNumberPaths = ValidPaths<
        typeof schema,
        'type',
        'admin',
        number
      >;

      expectTypeOf<`permissions.${number}.level`>().toExtend<AdminNumberPaths>();
      // string field should not be included
      expectTypeOf<`permissions.${number}.resource`>().not.toExtend<AdminNumberPaths>();
    });
  });
});
