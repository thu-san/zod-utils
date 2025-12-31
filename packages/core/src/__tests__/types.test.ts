import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import type {
  DiscriminatedInput,
  FileList,
  NameField,
  Paths,
  SchemaField,
  SchemaFieldSelector,
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

    // biome-ignore lint/suspicious/noTemplateCurlyInString: test literal number for intellisense
    it('should extract array paths with ${number} literal string', () => {
      type AllPaths = Paths<ArraySchema>;

      // Should include paths with literal '${number}' string for dynamic array access
      // This is what React Hook Form uses for array field paths
      expectTypeOf<'tags.${number}'>().toExtend<AllPaths>();
      expectTypeOf<'items.${number}'>().toExtend<AllPaths>();
      expectTypeOf<'items.${number}.id'>().toExtend<AllPaths>();
      expectTypeOf<'items.${number}.name'>().toExtend<AllPaths>();
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

      // Both 'age' (number) and 'count' (number | null) should be included
      expectTypeOf<NumberPaths>().toEqualTypeOf<'age' | 'count'>();

      // Negative tests - non-number fields should NOT match
      expectTypeOf<'name'>().not.toExtend<NumberPaths>();
      expectTypeOf<'email'>().not.toExtend<NumberPaths>();
      expectTypeOf<'active'>().not.toExtend<NumberPaths>();
    });

    it('should extract optional string paths with non-strict mode', () => {
      type StringPaths = Paths<Schema, string, false>;

      // Both 'name' (string) and 'email' (string | undefined) should be included
      expectTypeOf<StringPaths>().toEqualTypeOf<'name' | 'email'>();

      // Negative tests - non-string fields should NOT match
      expectTypeOf<'age'>().not.toExtend<StringPaths>();
      expectTypeOf<'count'>().not.toExtend<StringPaths>();
      expectTypeOf<'active'>().not.toExtend<StringPaths>();
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

describe('SchemaFieldSelector', () => {
  describe('with regular schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should create params without discriminator', () => {
      type Params = SchemaFieldSelector<typeof schema, 'name' | 'age'>;

      // For non-discriminated union schemas, discriminator should be prohibited (never)
      expectTypeOf<Params>().toMatchTypeOf<{
        schema: typeof schema;
        name: 'name' | 'age';
      }>();

      // Verify discriminator is optional and cannot hold a meaningful value
      expectTypeOf<Params['discriminator']>().toEqualTypeOf<undefined>();
    });

    it('should have name constrained to valid paths', () => {
      type Params = SchemaFieldSelector<typeof schema, 'name' | 'age'>;

      expectTypeOf<Params['name']>().toEqualTypeOf<'name' | 'age'>();
    });
  });

  describe('with discriminated union', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    it('should require discriminator for discriminated union', () => {
      type Params = SchemaFieldSelector<
        typeof schema,
        'mode' | 'name',
        'mode',
        'create'
      >;

      expectTypeOf<Params>().toExtend<{
        schema: typeof schema;
        name: 'mode' | 'name';
        discriminator: {
          key: 'mode';
          value: 'create';
        };
      }>();
    });

    it('should narrow name paths based on discriminator', () => {
      type CreateParams = SchemaFieldSelector<
        typeof schema,
        'mode' | 'name',
        'mode',
        'create'
      >;
      type EditParams = SchemaFieldSelector<
        typeof schema,
        'mode' | 'id',
        'mode',
        'edit'
      >;

      expectTypeOf<CreateParams['name']>().toEqualTypeOf<'mode' | 'name'>();
      expectTypeOf<EditParams['name']>().toEqualTypeOf<'mode' | 'id'>();
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
      type TightStringPaths = Paths<Schema, string>;

      // Only 'required' has exact type 'string'
      expectTypeOf<'required'>().toExtend<TightStringPaths>();
    });

    it('should NOT match optional/nullable/nullish in strict mode with string filter', () => {
      type TightStringPaths = Paths<Schema, string>;

      // These should NOT match because they are not exactly 'string'
      expectTypeOf<'optional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nullable'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nullish'>().not.toExtend<TightStringPaths>();
    });

    it('should match string | undefined filter', () => {
      type TightOptionalPaths = Paths<Schema, string | undefined>;

      // 'optional' matches, and 'required' also matches since string extends string | undefined
      expectTypeOf<'optional'>().toExtend<TightOptionalPaths>();
      expectTypeOf<'required'>().toExtend<TightOptionalPaths>();
    });

    it('should NOT match nullable/nullish in strict mode with string | undefined filter', () => {
      type TightOptionalPaths = Paths<Schema, string | undefined>;

      // These should NOT match because they contain null
      expectTypeOf<'nullable'>().not.toExtend<TightOptionalPaths>();
      expectTypeOf<'nullish'>().not.toExtend<TightOptionalPaths>();
    });
  });

  describe('non-strict mode', () => {
    it('should match types where any part extends string', () => {
      type LooseStringPaths = Paths<Schema, string, false>;

      // All fields have string as part of their union, so all match
      expectTypeOf<'required'>().toExtend<LooseStringPaths>();
      expectTypeOf<'optional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nullish'>().toExtend<LooseStringPaths>();
    });
  });
});

describe('Strict vs Non-Strict mode with multiple field types', () => {
  type MixedSchema = {
    // String variants
    strRequired: string;
    strOptional: string | undefined;
    strNullable: string | null;
    strNullish: string | null | undefined;
    // Number variants
    numRequired: number;
    numOptional: number | undefined;
    numNullable: number | null;
    numNullish: number | null | undefined;
    // Boolean variants
    boolRequired: boolean;
    boolOptional: boolean | undefined;
    boolNullable: boolean | null;
    boolNullish: boolean | null | undefined;
    // Array variants
    arrRequired: string[];
    arrOptional: string[] | undefined;
    arrNullable: string[] | null;
    arrNullish: string[] | null | undefined;
  };

  describe('strict mode - string filter', () => {
    type TightStringPaths = Paths<MixedSchema, string>;

    it('should match only exact string field', () => {
      expectTypeOf<'strRequired'>().toExtend<TightStringPaths>();
    });

    it('should NOT match optional/nullable/nullish string fields', () => {
      expectTypeOf<'strOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'strNullable'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'strNullish'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'numRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'numOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'numNullable'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'boolRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'boolOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'boolNullable'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match array fields', () => {
      expectTypeOf<'arrRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrNullable'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('strict mode - number filter', () => {
    type TightNumberPaths = Paths<MixedSchema, number>;

    it('should match only exact number field', () => {
      expectTypeOf<'numRequired'>().toExtend<TightNumberPaths>();
    });

    it('should NOT match optional/nullable/nullish number fields', () => {
      expectTypeOf<'numOptional'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'numNullable'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'numNullish'>().not.toExtend<TightNumberPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'strRequired'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'strOptional'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'strNullable'>().not.toExtend<TightNumberPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'boolRequired'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'boolOptional'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'boolNullable'>().not.toExtend<TightNumberPaths>();
    });

    it('should NOT match array fields', () => {
      expectTypeOf<'arrRequired'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'arrOptional'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'arrNullable'>().not.toExtend<TightNumberPaths>();
    });
  });

  describe('strict mode - boolean filter', () => {
    type TightBooleanPaths = Paths<MixedSchema, boolean>;

    it('should match only exact boolean field', () => {
      expectTypeOf<'boolRequired'>().toExtend<TightBooleanPaths>();
    });

    it('should NOT match optional/nullable/nullish boolean fields', () => {
      expectTypeOf<'boolOptional'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'boolNullable'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'boolNullish'>().not.toExtend<TightBooleanPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'strRequired'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'strOptional'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'strNullable'>().not.toExtend<TightBooleanPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'numRequired'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'numOptional'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'numNullable'>().not.toExtend<TightBooleanPaths>();
    });

    it('should NOT match array fields', () => {
      expectTypeOf<'arrRequired'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'arrOptional'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'arrNullable'>().not.toExtend<TightBooleanPaths>();
    });
  });

  describe('strict mode - array filter', () => {
    type TightArrayPaths = Paths<MixedSchema, string[]>;

    it('should match only exact array field', () => {
      expectTypeOf<'arrRequired'>().toExtend<TightArrayPaths>();
    });

    it('should NOT match optional/nullable/nullish array fields', () => {
      expectTypeOf<'arrOptional'>().not.toExtend<TightArrayPaths>();
      expectTypeOf<'arrNullable'>().not.toExtend<TightArrayPaths>();
      expectTypeOf<'arrNullish'>().not.toExtend<TightArrayPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'strRequired'>().not.toExtend<TightArrayPaths>();
      expectTypeOf<'strOptional'>().not.toExtend<TightArrayPaths>();
      expectTypeOf<'strNullable'>().not.toExtend<TightArrayPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'numRequired'>().not.toExtend<TightArrayPaths>();
      expectTypeOf<'numOptional'>().not.toExtend<TightArrayPaths>();
      expectTypeOf<'numNullable'>().not.toExtend<TightArrayPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'boolRequired'>().not.toExtend<TightArrayPaths>();
      expectTypeOf<'boolOptional'>().not.toExtend<TightArrayPaths>();
      expectTypeOf<'boolNullable'>().not.toExtend<TightArrayPaths>();
    });
  });

  describe('non-strict mode - string filter', () => {
    type LooseStringPaths = Paths<MixedSchema, string, false>;

    it('should match all string variant fields', () => {
      expectTypeOf<'strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'strNullish'>().toExtend<LooseStringPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'numRequired'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'numOptional'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'numNullable'>().not.toExtend<LooseStringPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'boolRequired'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'boolOptional'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'boolNullable'>().not.toExtend<LooseStringPaths>();
    });

    it('should NOT match array fields', () => {
      expectTypeOf<'arrRequired'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'arrOptional'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'arrNullable'>().not.toExtend<LooseStringPaths>();
    });

    it('should match strNullish with null filter', () => {
      type LooseNullPaths = Paths<MixedSchema, null, false>;
      expectTypeOf<'strNullish'>().toExtend<LooseNullPaths>();
    });

    it('should match strNullish with undefined filter', () => {
      type LooseUndefinedPaths = Paths<MixedSchema, undefined, false>;
      expectTypeOf<'strNullish'>().toExtend<LooseUndefinedPaths>();
    });
  });

  describe('non-strict mode - number filter', () => {
    type LooseNumberPaths = Paths<MixedSchema, number, false>;

    it('should match all number variant fields', () => {
      expectTypeOf<'numRequired'>().toExtend<LooseNumberPaths>();
      expectTypeOf<'numOptional'>().toExtend<LooseNumberPaths>();
      expectTypeOf<'numNullable'>().toExtend<LooseNumberPaths>();
      expectTypeOf<'numNullish'>().toExtend<LooseNumberPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'strRequired'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'strOptional'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'strNullable'>().not.toExtend<LooseNumberPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'boolRequired'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'boolOptional'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'boolNullable'>().not.toExtend<LooseNumberPaths>();
    });

    it('should NOT match array fields', () => {
      expectTypeOf<'arrRequired'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'arrOptional'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'arrNullable'>().not.toExtend<LooseNumberPaths>();
    });
  });

  describe('non-strict mode - boolean filter', () => {
    type LooseBooleanPaths = Paths<MixedSchema, boolean, false>;

    it('should match all boolean variant fields', () => {
      expectTypeOf<'boolRequired'>().toExtend<LooseBooleanPaths>();
      expectTypeOf<'boolOptional'>().toExtend<LooseBooleanPaths>();
      expectTypeOf<'boolNullable'>().toExtend<LooseBooleanPaths>();
      expectTypeOf<'boolNullish'>().toExtend<LooseBooleanPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'strRequired'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'strOptional'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'strNullable'>().not.toExtend<LooseBooleanPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'numRequired'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'numOptional'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'numNullable'>().not.toExtend<LooseBooleanPaths>();
    });

    it('should NOT match array fields', () => {
      expectTypeOf<'arrRequired'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'arrOptional'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'arrNullable'>().not.toExtend<LooseBooleanPaths>();
    });
  });

  describe('non-strict mode - array filter', () => {
    type LooseArrayPaths = Paths<MixedSchema, string[], false>;

    it('should match all array variant fields', () => {
      expectTypeOf<'arrRequired'>().toExtend<LooseArrayPaths>();
      expectTypeOf<'arrOptional'>().toExtend<LooseArrayPaths>();
      expectTypeOf<'arrNullable'>().toExtend<LooseArrayPaths>();
      expectTypeOf<'arrNullish'>().toExtend<LooseArrayPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'strRequired'>().not.toExtend<LooseArrayPaths>();
      expectTypeOf<'strOptional'>().not.toExtend<LooseArrayPaths>();
      expectTypeOf<'strNullable'>().not.toExtend<LooseArrayPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'numRequired'>().not.toExtend<LooseArrayPaths>();
      expectTypeOf<'numOptional'>().not.toExtend<LooseArrayPaths>();
      expectTypeOf<'numNullable'>().not.toExtend<LooseArrayPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'boolRequired'>().not.toExtend<LooseArrayPaths>();
      expectTypeOf<'boolOptional'>().not.toExtend<LooseArrayPaths>();
      expectTypeOf<'boolNullable'>().not.toExtend<LooseArrayPaths>();
    });
  });

  describe('strict mode - string filter for array element paths', () => {
    type TightStringPaths = Paths<MixedSchema, string>;

    it('should match array element paths from required string array', () => {
      expectTypeOf<'arrRequired.0'>().toExtend<TightStringPaths>();
      expectTypeOf<'arrRequired.${number}'>().toExtend<TightStringPaths>();
    });

    it('should NOT match array element paths from optional string array in strict mode', () => {
      expectTypeOf<'arrOptional.0'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrOptional.${number}'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match array element paths from nullable string array in strict mode', () => {
      expectTypeOf<'arrNullable.0'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrNullable.${number}'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match array element paths from nullish string array in strict mode', () => {
      expectTypeOf<'arrNullish.0'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrNullish.${number}'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('non-strict mode - string filter for array element paths', () => {
    type LooseStringPaths = Paths<MixedSchema, string, false>;

    it('should match all array element paths from string arrays', () => {
      // Required array elements
      expectTypeOf<'arrRequired.0'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrRequired.${number}'>().toExtend<LooseStringPaths>();

      // Optional array elements
      expectTypeOf<'arrOptional.0'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrOptional.${number}'>().toExtend<LooseStringPaths>();

      // Nullable array elements
      expectTypeOf<'arrNullable.0'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrNullable.${number}'>().toExtend<LooseStringPaths>();

      // Nullish array elements
      expectTypeOf<'arrNullish.0'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrNullish.${number}'>().toExtend<LooseStringPaths>();
    });
  });
});

describe('Filtering with null and undefined', () => {
  type NullUndefinedSchema = {
    // Pure null/undefined
    justNull: null;
    justUndefined: undefined;
    // String with null/undefined
    strWithNull: string | null;
    strWithUndefined: string | undefined;
    strWithBoth: string | null | undefined;
    // Number with null/undefined
    numWithNull: number | null;
    numWithUndefined: number | undefined;
    numWithBoth: number | null | undefined;
    // Plain types for comparison
    plainStr: string;
    plainNum: number;
  };

  describe('strict mode - null filter', () => {
    type TightNullPaths = Paths<NullUndefinedSchema, null>;

    it('should match only pure null field', () => {
      expectTypeOf<'justNull'>().toExtend<TightNullPaths>();
    });

    it('should NOT match undefined field', () => {
      expectTypeOf<'justUndefined'>().not.toExtend<TightNullPaths>();
    });

    it('should NOT match string | null fields (not exact match)', () => {
      expectTypeOf<'strWithNull'>().not.toExtend<TightNullPaths>();
      expectTypeOf<'strWithBoth'>().not.toExtend<TightNullPaths>();
    });

    it('should NOT match number | null fields (not exact match)', () => {
      expectTypeOf<'numWithNull'>().not.toExtend<TightNullPaths>();
      expectTypeOf<'numWithBoth'>().not.toExtend<TightNullPaths>();
    });

    it('should NOT match plain types', () => {
      expectTypeOf<'plainStr'>().not.toExtend<TightNullPaths>();
      expectTypeOf<'plainNum'>().not.toExtend<TightNullPaths>();
    });
  });

  describe('strict mode - undefined filter', () => {
    type TightUndefinedPaths = Paths<NullUndefinedSchema, undefined>;

    it('should match only pure undefined field', () => {
      expectTypeOf<'justUndefined'>().toExtend<TightUndefinedPaths>();
    });

    it('should NOT match null field', () => {
      expectTypeOf<'justNull'>().not.toExtend<TightUndefinedPaths>();
    });

    it('should NOT match string | undefined fields (not exact match)', () => {
      expectTypeOf<'strWithUndefined'>().not.toExtend<TightUndefinedPaths>();
      expectTypeOf<'strWithBoth'>().not.toExtend<TightUndefinedPaths>();
    });

    it('should NOT match number | undefined fields (not exact match)', () => {
      expectTypeOf<'numWithUndefined'>().not.toExtend<TightUndefinedPaths>();
      expectTypeOf<'numWithBoth'>().not.toExtend<TightUndefinedPaths>();
    });

    it('should NOT match plain types', () => {
      expectTypeOf<'plainStr'>().not.toExtend<TightUndefinedPaths>();
      expectTypeOf<'plainNum'>().not.toExtend<TightUndefinedPaths>();
    });
  });

  describe('strict mode - null | undefined filter', () => {
    type TightNullOrUndefinedPaths = Paths<
      NullUndefinedSchema,
      null | undefined
    >;

    it('should match pure null and undefined fields', () => {
      expectTypeOf<'justNull'>().toExtend<TightNullOrUndefinedPaths>();
      expectTypeOf<'justUndefined'>().toExtend<TightNullOrUndefinedPaths>();
    });

    it('should NOT match union fields (not exact match)', () => {
      expectTypeOf<'strWithNull'>().not.toExtend<TightNullOrUndefinedPaths>();
      expectTypeOf<'strWithUndefined'>().not.toExtend<TightNullOrUndefinedPaths>();
      expectTypeOf<'strWithBoth'>().not.toExtend<TightNullOrUndefinedPaths>();
      expectTypeOf<'numWithNull'>().not.toExtend<TightNullOrUndefinedPaths>();
      expectTypeOf<'numWithUndefined'>().not.toExtend<TightNullOrUndefinedPaths>();
      expectTypeOf<'numWithBoth'>().not.toExtend<TightNullOrUndefinedPaths>();
    });

    it('should NOT match plain types', () => {
      expectTypeOf<'plainStr'>().not.toExtend<TightNullOrUndefinedPaths>();
      expectTypeOf<'plainNum'>().not.toExtend<TightNullOrUndefinedPaths>();
    });
  });

  describe('non-strict mode - null filter', () => {
    type LooseNullPaths = Paths<NullUndefinedSchema, null, false>;

    it('should match pure null field', () => {
      expectTypeOf<'justNull'>().toExtend<LooseNullPaths>();
    });

    it('should match fields containing null in union', () => {
      expectTypeOf<'strWithNull'>().toExtend<LooseNullPaths>();
      expectTypeOf<'strWithBoth'>().toExtend<LooseNullPaths>();
      expectTypeOf<'numWithNull'>().toExtend<LooseNullPaths>();
      expectTypeOf<'numWithBoth'>().toExtend<LooseNullPaths>();
    });

    it('should NOT match undefined-only field', () => {
      expectTypeOf<'justUndefined'>().not.toExtend<LooseNullPaths>();
    });

    it('should NOT match fields with only undefined (no null)', () => {
      expectTypeOf<'strWithUndefined'>().not.toExtend<LooseNullPaths>();
      expectTypeOf<'numWithUndefined'>().not.toExtend<LooseNullPaths>();
    });

    it('should NOT match plain types', () => {
      expectTypeOf<'plainStr'>().not.toExtend<LooseNullPaths>();
      expectTypeOf<'plainNum'>().not.toExtend<LooseNullPaths>();
    });
  });

  describe('non-strict mode - undefined filter', () => {
    type LooseUndefinedPaths = Paths<NullUndefinedSchema, undefined, false>;

    it('should match pure undefined field', () => {
      expectTypeOf<'justUndefined'>().toExtend<LooseUndefinedPaths>();
    });

    it('should match fields containing undefined in union', () => {
      expectTypeOf<'strWithUndefined'>().toExtend<LooseUndefinedPaths>();
      expectTypeOf<'strWithBoth'>().toExtend<LooseUndefinedPaths>();
      expectTypeOf<'numWithUndefined'>().toExtend<LooseUndefinedPaths>();
      expectTypeOf<'numWithBoth'>().toExtend<LooseUndefinedPaths>();
    });

    it('should NOT match null-only field', () => {
      expectTypeOf<'justNull'>().not.toExtend<LooseUndefinedPaths>();
    });

    it('should NOT match fields with only null (no undefined)', () => {
      expectTypeOf<'strWithNull'>().not.toExtend<LooseUndefinedPaths>();
      expectTypeOf<'numWithNull'>().not.toExtend<LooseUndefinedPaths>();
    });

    it('should NOT match plain types', () => {
      expectTypeOf<'plainStr'>().not.toExtend<LooseUndefinedPaths>();
      expectTypeOf<'plainNum'>().not.toExtend<LooseUndefinedPaths>();
    });
  });

  describe('non-strict mode - null | undefined filter', () => {
    type LooseNullOrUndefinedPaths = Paths<
      NullUndefinedSchema,
      null | undefined,
      false
    >;

    it('should match pure null and undefined fields', () => {
      expectTypeOf<'justNull'>().toExtend<LooseNullOrUndefinedPaths>();
      expectTypeOf<'justUndefined'>().toExtend<LooseNullOrUndefinedPaths>();
    });

    it('should match all fields containing null or undefined', () => {
      expectTypeOf<'strWithNull'>().toExtend<LooseNullOrUndefinedPaths>();
      expectTypeOf<'strWithUndefined'>().toExtend<LooseNullOrUndefinedPaths>();
      expectTypeOf<'strWithBoth'>().toExtend<LooseNullOrUndefinedPaths>();
      expectTypeOf<'numWithNull'>().toExtend<LooseNullOrUndefinedPaths>();
      expectTypeOf<'numWithUndefined'>().toExtend<LooseNullOrUndefinedPaths>();
      expectTypeOf<'numWithBoth'>().toExtend<LooseNullOrUndefinedPaths>();
    });

    it('should NOT match plain types', () => {
      expectTypeOf<'plainStr'>().not.toExtend<LooseNullOrUndefinedPaths>();
      expectTypeOf<'plainNum'>().not.toExtend<LooseNullOrUndefinedPaths>();
    });
  });
});

describe('Filtering with nested objects and arrays', () => {
  type ComplexSchema = {
    // Top-level primitives
    name: string;
    age: number;
    active: boolean;
    // Nested object
    profile: {
      bio: string;
      score: number;
      verified: boolean;
    };
    // Optional nested object
    settings:
      | {
          theme: string;
          volume: number;
        }
      | undefined;
    // Nullable nested object
    metadata: {
      created: string;
      updated: number;
    } | null;
    // String array
    tags: string[];
    // Number array
    scores: number[];
    // Boolean array
    flags: boolean[];
    // Array of objects
    items: {
      id: number;
      label: string;
      enabled: boolean;
    }[];
    // Optional arrays
    optionalTags: string[] | undefined;
    nullableScores: number[] | null;
    // Optional array of objects
    optionalItems:
      | {
          key: string;
          value: number;
        }[]
      | undefined;
  };

  describe('strict mode - string filter with nested paths', () => {
    type TightStringPaths = Paths<ComplexSchema, string>;

    it('should match top-level string field', () => {
      expectTypeOf<'name'>().toExtend<TightStringPaths>();
    });

    it('should match nested object string fields', () => {
      expectTypeOf<'profile.bio'>().toExtend<TightStringPaths>();
    });

    it('should match string array element paths', () => {
      expectTypeOf<'tags.0'>().toExtend<TightStringPaths>();
      expectTypeOf<'tags.${number}'>().toExtend<TightStringPaths>();
    });

    it('should match string fields in array of objects', () => {
      expectTypeOf<'items.0.label'>().toExtend<TightStringPaths>();
      expectTypeOf<'items.${number}.label'>().toExtend<TightStringPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'age'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'profile.score'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'scores.0'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'items.0.id'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'active'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'profile.verified'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'flags.0'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'items.0.enabled'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match optional nested object string fields in strict mode', () => {
      expectTypeOf<'settings.theme'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'metadata.created'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match optional array element paths in strict mode', () => {
      expectTypeOf<'optionalTags.0'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'optionalItems.0.key'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('strict mode - number filter with nested paths', () => {
    type TightNumberPaths = Paths<ComplexSchema, number>;

    it('should match top-level number field', () => {
      expectTypeOf<'age'>().toExtend<TightNumberPaths>();
    });

    it('should match nested object number fields', () => {
      expectTypeOf<'profile.score'>().toExtend<TightNumberPaths>();
    });

    it('should match number array element paths', () => {
      expectTypeOf<'scores.0'>().toExtend<TightNumberPaths>();
      expectTypeOf<'scores.${number}'>().toExtend<TightNumberPaths>();
    });

    it('should match number fields in array of objects', () => {
      expectTypeOf<'items.0.id'>().toExtend<TightNumberPaths>();
      expectTypeOf<'items.${number}.id'>().toExtend<TightNumberPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'name'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'profile.bio'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'tags.0'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'items.0.label'>().not.toExtend<TightNumberPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'active'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'profile.verified'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'flags.0'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'items.0.enabled'>().not.toExtend<TightNumberPaths>();
    });

    it('should NOT match optional nested object number fields in strict mode', () => {
      expectTypeOf<'settings.volume'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'metadata.updated'>().not.toExtend<TightNumberPaths>();
    });

    it('should NOT match nullable array element paths in strict mode', () => {
      expectTypeOf<'nullableScores.0'>().not.toExtend<TightNumberPaths>();
      expectTypeOf<'optionalItems.0.value'>().not.toExtend<TightNumberPaths>();
    });
  });

  describe('strict mode - boolean filter with nested paths', () => {
    type TightBooleanPaths = Paths<ComplexSchema, boolean>;

    it('should match top-level boolean field', () => {
      expectTypeOf<'active'>().toExtend<TightBooleanPaths>();
    });

    it('should match nested object boolean fields', () => {
      expectTypeOf<'profile.verified'>().toExtend<TightBooleanPaths>();
    });

    it('should match boolean array element paths', () => {
      expectTypeOf<'flags.0'>().toExtend<TightBooleanPaths>();
      expectTypeOf<'flags.${number}'>().toExtend<TightBooleanPaths>();
    });

    it('should match boolean fields in array of objects', () => {
      expectTypeOf<'items.0.enabled'>().toExtend<TightBooleanPaths>();
      expectTypeOf<'items.${number}.enabled'>().toExtend<TightBooleanPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'name'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'profile.bio'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'tags.0'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'items.0.label'>().not.toExtend<TightBooleanPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'age'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'profile.score'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'scores.0'>().not.toExtend<TightBooleanPaths>();
      expectTypeOf<'items.0.id'>().not.toExtend<TightBooleanPaths>();
    });
  });

  describe('non-strict mode - string filter with nested paths', () => {
    type LooseStringPaths = Paths<ComplexSchema, string, false>;

    it('should match top-level string field', () => {
      expectTypeOf<'name'>().toExtend<LooseStringPaths>();
    });

    it('should match nested object string fields', () => {
      expectTypeOf<'profile.bio'>().toExtend<LooseStringPaths>();
    });

    it('should match optional nested object string fields', () => {
      expectTypeOf<'settings.theme'>().toExtend<LooseStringPaths>();
      expectTypeOf<'metadata.created'>().toExtend<LooseStringPaths>();
    });

    it('should match string array element paths', () => {
      expectTypeOf<'tags.0'>().toExtend<LooseStringPaths>();
      expectTypeOf<'tags.${number}'>().toExtend<LooseStringPaths>();
    });

    it('should match optional string array element paths', () => {
      expectTypeOf<'optionalTags.0'>().toExtend<LooseStringPaths>();
    });

    it('should match string fields in array of objects', () => {
      expectTypeOf<'items.0.label'>().toExtend<LooseStringPaths>();
      expectTypeOf<'items.${number}.label'>().toExtend<LooseStringPaths>();
    });

    it('should match optional array of objects string fields', () => {
      expectTypeOf<'optionalItems.0.key'>().toExtend<LooseStringPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'age'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'profile.score'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'scores.0'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'items.0.id'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'settings.volume'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'optionalItems.0.value'>().not.toExtend<LooseStringPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'active'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'profile.verified'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'flags.0'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'items.0.enabled'>().not.toExtend<LooseStringPaths>();
    });
  });

  describe('non-strict mode - number filter with nested paths', () => {
    type LooseNumberPaths = Paths<ComplexSchema, number, false>;

    it('should match top-level number field', () => {
      expectTypeOf<'age'>().toExtend<LooseNumberPaths>();
    });

    it('should match nested object number fields', () => {
      expectTypeOf<'profile.score'>().toExtend<LooseNumberPaths>();
    });

    it('should match optional nested object number fields', () => {
      expectTypeOf<'settings.volume'>().toExtend<LooseNumberPaths>();
      expectTypeOf<'metadata.updated'>().toExtend<LooseNumberPaths>();
    });

    it('should match number array element paths', () => {
      expectTypeOf<'scores.0'>().toExtend<LooseNumberPaths>();
      expectTypeOf<'scores.${number}'>().toExtend<LooseNumberPaths>();
    });

    it('should match nullable number array element paths', () => {
      expectTypeOf<'nullableScores.0'>().toExtend<LooseNumberPaths>();
    });

    it('should match number fields in array of objects', () => {
      expectTypeOf<'items.0.id'>().toExtend<LooseNumberPaths>();
      expectTypeOf<'items.${number}.id'>().toExtend<LooseNumberPaths>();
    });

    it('should match optional array of objects number fields', () => {
      expectTypeOf<'optionalItems.0.value'>().toExtend<LooseNumberPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'name'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'profile.bio'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'tags.0'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'items.0.label'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'settings.theme'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'optionalItems.0.key'>().not.toExtend<LooseNumberPaths>();
    });

    it('should NOT match boolean fields', () => {
      expectTypeOf<'active'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'profile.verified'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'flags.0'>().not.toExtend<LooseNumberPaths>();
      expectTypeOf<'items.0.enabled'>().not.toExtend<LooseNumberPaths>();
    });
  });

  describe('non-strict mode - boolean filter with nested paths', () => {
    type LooseBooleanPaths = Paths<ComplexSchema, boolean, false>;

    it('should match top-level boolean field', () => {
      expectTypeOf<'active'>().toExtend<LooseBooleanPaths>();
    });

    it('should match nested object boolean fields', () => {
      expectTypeOf<'profile.verified'>().toExtend<LooseBooleanPaths>();
    });

    it('should match boolean array element paths', () => {
      expectTypeOf<'flags.0'>().toExtend<LooseBooleanPaths>();
      expectTypeOf<'flags.${number}'>().toExtend<LooseBooleanPaths>();
    });

    it('should match boolean fields in array of objects', () => {
      expectTypeOf<'items.0.enabled'>().toExtend<LooseBooleanPaths>();
      expectTypeOf<'items.${number}.enabled'>().toExtend<LooseBooleanPaths>();
    });

    it('should NOT match string fields', () => {
      expectTypeOf<'name'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'profile.bio'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'tags.0'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'items.0.label'>().not.toExtend<LooseBooleanPaths>();
    });

    it('should NOT match number fields', () => {
      expectTypeOf<'age'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'profile.score'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'scores.0'>().not.toExtend<LooseBooleanPaths>();
      expectTypeOf<'items.0.id'>().not.toExtend<LooseBooleanPaths>();
    });
  });

  describe('strict mode - array type filters', () => {
    it('should match string array paths with string[] filter', () => {
      type StringArrayPaths = Paths<ComplexSchema, string[]>;

      expectTypeOf<'tags'>().toExtend<StringArrayPaths>();
    });

    it('should NOT match optional string array with string[] filter in strict mode', () => {
      type StringArrayPaths = Paths<ComplexSchema, string[]>;

      expectTypeOf<'optionalTags'>().not.toExtend<StringArrayPaths>();
    });

    it('should match number array paths with number[] filter', () => {
      type NumberArrayPaths = Paths<ComplexSchema, number[]>;

      expectTypeOf<'scores'>().toExtend<NumberArrayPaths>();
    });

    it('should NOT match nullable number array with number[] filter in strict mode', () => {
      type NumberArrayPaths = Paths<ComplexSchema, number[]>;

      expectTypeOf<'nullableScores'>().not.toExtend<NumberArrayPaths>();
    });

    it('should match boolean array paths with boolean[] filter', () => {
      type BooleanArrayPaths = Paths<ComplexSchema, boolean[]>;

      expectTypeOf<'flags'>().toExtend<BooleanArrayPaths>();
    });

    it('should match object array paths with matching object[] filter', () => {
      type ItemArrayPaths = Paths<
        ComplexSchema,
        { id: number; label: string; enabled: boolean }[]
      >;

      expectTypeOf<'items'>().toExtend<ItemArrayPaths>();
    });

    it('should NOT match optional object array with object[] filter in strict mode', () => {
      type KeyValueArrayPaths = Paths<
        ComplexSchema,
        { key: string; value: number }[]
      >;

      expectTypeOf<'optionalItems'>().not.toExtend<KeyValueArrayPaths>();
    });
  });

  describe('non-strict mode - array type filters', () => {
    it('should match string array paths with string[] filter', () => {
      type StringArrayPaths = Paths<ComplexSchema, string[], false>;

      expectTypeOf<'tags'>().toExtend<StringArrayPaths>();
    });

    it('should match optional string array with string[] filter in non-strict mode', () => {
      type StringArrayPaths = Paths<ComplexSchema, string[], false>;

      expectTypeOf<'optionalTags'>().toExtend<StringArrayPaths>();
    });

    it('should match number array paths with number[] filter', () => {
      type NumberArrayPaths = Paths<ComplexSchema, number[], false>;

      expectTypeOf<'scores'>().toExtend<NumberArrayPaths>();
    });

    it('should match nullable number array with number[] filter in non-strict mode', () => {
      type NumberArrayPaths = Paths<ComplexSchema, number[], false>;

      expectTypeOf<'nullableScores'>().toExtend<NumberArrayPaths>();
    });

    it('should match optional object array with object[] filter in non-strict mode', () => {
      type KeyValueArrayPaths = Paths<
        ComplexSchema,
        { key: string; value: number }[],
        false
      >;

      expectTypeOf<'optionalItems'>().toExtend<KeyValueArrayPaths>();
    });
  });

  describe('strict mode - nested object type filters', () => {
    it('should match nested object paths with matching object filter', () => {
      type ProfilePaths = Paths<
        ComplexSchema,
        { bio: string; score: number; verified: boolean }
      >;

      expectTypeOf<'profile'>().toExtend<ProfilePaths>();
    });

    it('should NOT match optional nested object in strict mode', () => {
      type SettingsPaths = Paths<
        ComplexSchema,
        { theme: string; volume: number }
      >;

      expectTypeOf<'settings'>().not.toExtend<SettingsPaths>();
    });

    it('should NOT match nullable nested object in strict mode', () => {
      type MetadataPaths = Paths<
        ComplexSchema,
        { created: string; updated: number }
      >;

      expectTypeOf<'metadata'>().not.toExtend<MetadataPaths>();
    });
  });

  describe('non-strict mode - nested object type filters', () => {
    it('should match nested object paths with matching object filter', () => {
      type ProfilePaths = Paths<
        ComplexSchema,
        { bio: string; score: number; verified: boolean },
        false
      >;

      expectTypeOf<'profile'>().toExtend<ProfilePaths>();
    });

    it('should match optional nested object in non-strict mode', () => {
      type SettingsPaths = Paths<
        ComplexSchema,
        { theme: string; volume: number },
        false
      >;

      expectTypeOf<'settings'>().toExtend<SettingsPaths>();
    });

    it('should match nullable nested object in non-strict mode', () => {
      type MetadataPaths = Paths<
        ComplexSchema,
        { created: string; updated: number },
        false
      >;

      expectTypeOf<'metadata'>().toExtend<MetadataPaths>();
    });
  });
});

describe('Nested objects with inner optional/nullable fields', () => {
  // Schema with nested objects where inner fields have optional/nullable/nullish variants
  type StrTypes = {
    strRequired: string;
    strOptional: string | undefined;
    strNullable: string | null;
    strNullish: string | null | undefined;
  };

  type NestedSchema = {
    // Nested objects with different wrapper types
    nestedRequiredObj: StrTypes;
    nestedOptionalObj?: StrTypes;
    nestedNullableObj: StrTypes | null;
    nestedNullishObj?: StrTypes | null;
    // Arrays of objects with different wrapper types
    arrayOfObjects: Array<StrTypes>;
    arrayOptionalObjects?: Array<StrTypes>;
    arrayNullableObjects: Array<StrTypes> | null;
    arrayNullishObjects?: Array<StrTypes> | null;
  };

  describe('strict mode - top-level object and array paths', () => {
    it('should match nestedRequiredObj with StrTypes filter', () => {
      type TightStrTypesPaths = Paths<NestedSchema, StrTypes>;
      expectTypeOf<'nestedRequiredObj'>().toExtend<TightStrTypesPaths>();
    });

    it('should NOT match optional/nullable/nullish objects with StrTypes filter', () => {
      type TightStrTypesPaths = Paths<NestedSchema, StrTypes>;
      expectTypeOf<'nestedOptionalObj'>().not.toExtend<TightStrTypesPaths>();
      expectTypeOf<'nestedNullableObj'>().not.toExtend<TightStrTypesPaths>();
      expectTypeOf<'nestedNullishObj'>().not.toExtend<TightStrTypesPaths>();
    });

    it('should match arrayOfObjects with Array<StrTypes> filter', () => {
      type TightArrayOfStrTypesPaths = Paths<NestedSchema, Array<StrTypes>>;
      expectTypeOf<'arrayOfObjects'>().toExtend<TightArrayOfStrTypesPaths>();
    });

    it('should NOT match optional/nullable/nullish arrays with Array<StrTypes> filter', () => {
      type TightArrayOfStrTypesPaths = Paths<NestedSchema, Array<StrTypes>>;
      expectTypeOf<'arrayOptionalObjects'>().not.toExtend<TightArrayOfStrTypesPaths>();
      expectTypeOf<'arrayNullableObjects'>().not.toExtend<TightArrayOfStrTypesPaths>();
      expectTypeOf<'arrayNullishObjects'>().not.toExtend<TightArrayOfStrTypesPaths>();
    });
  });

  describe('non-strict mode - top-level object and array paths', () => {
    it('should match all object paths with StrTypes filter', () => {
      type LooseStrTypesPaths = Paths<NestedSchema, StrTypes, false>;
      expectTypeOf<'nestedRequiredObj'>().toExtend<LooseStrTypesPaths>();
      expectTypeOf<'nestedOptionalObj'>().toExtend<LooseStrTypesPaths>();
      expectTypeOf<'nestedNullableObj'>().toExtend<LooseStrTypesPaths>();
      expectTypeOf<'nestedNullishObj'>().toExtend<LooseStrTypesPaths>();
    });

    it('should match all array paths with Array<StrTypes> filter', () => {
      type LooseArrayOfStrTypesPaths = Paths<
        NestedSchema,
        Array<StrTypes>,
        false
      >;
      expectTypeOf<'arrayOfObjects'>().toExtend<LooseArrayOfStrTypesPaths>();
      expectTypeOf<'arrayOptionalObjects'>().toExtend<LooseArrayOfStrTypesPaths>();
      expectTypeOf<'arrayNullableObjects'>().toExtend<LooseArrayOfStrTypesPaths>();
      expectTypeOf<'arrayNullishObjects'>().toExtend<LooseArrayOfStrTypesPaths>();
    });
  });

  describe('strict mode - nested required object with inner field variants', () => {
    type TightStringPaths = Paths<NestedSchema, string>;

    it('should match only strRequired from nestedRequiredObj', () => {
      expectTypeOf<'nestedRequiredObj.strRequired'>().toExtend<TightStringPaths>();
    });

    it('should NOT match optional/nullable/nullish inner fields from nestedRequiredObj', () => {
      expectTypeOf<'nestedRequiredObj.strOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedRequiredObj.strNullable'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedRequiredObj.strNullish'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('strict mode - nested optional/nullable/nullish objects', () => {
    type TightStringPaths = Paths<NestedSchema, string>;

    it('should NOT match any paths from nestedOptionalObj (parent is optional)', () => {
      expectTypeOf<'nestedOptionalObj.strRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedOptionalObj.strOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedOptionalObj.strNullable'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedOptionalObj.strNullish'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match any paths from nestedNullableObj (parent is nullable)', () => {
      expectTypeOf<'nestedNullableObj.strRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedNullableObj.strOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedNullableObj.strNullable'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedNullableObj.strNullish'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match any paths from nestedNullishObj (parent is nullish)', () => {
      expectTypeOf<'nestedNullishObj.strRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedNullishObj.strOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedNullishObj.strNullable'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nestedNullishObj.strNullish'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('strict mode - array of objects with inner field variants', () => {
    type TightStringPaths = Paths<NestedSchema, string>;

    it('should match only strRequired from arrayOfObjects elements', () => {
      expectTypeOf<`arrayOfObjects.${number}.strRequired`>().toExtend<TightStringPaths>();
    });

    it('should match strRequired with numeric index', () => {
      expectTypeOf<'arrayOfObjects.0.strRequired'>().toExtend<TightStringPaths>();
    });

    it('should NOT match optional/nullable/nullish inner fields from arrayOfObjects', () => {
      expectTypeOf<`arrayOfObjects.${number}.strOptional`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayOfObjects.${number}.strNullable`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayOfObjects.${number}.strNullish`>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match optional/nullable/nullish inner fields with numeric index', () => {
      expectTypeOf<'arrayOfObjects.0.strOptional'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrayOfObjects.0.strNullable'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrayOfObjects.0.strNullish'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('strict mode - optional/nullable/nullish arrays of objects', () => {
    type TightStringPaths = Paths<NestedSchema, string>;

    it('should NOT match any paths from arrayOptionalObjects (array is optional)', () => {
      expectTypeOf<`arrayOptionalObjects.${number}.strRequired`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayOptionalObjects.${number}.strOptional`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayOptionalObjects.${number}.strNullable`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayOptionalObjects.${number}.strNullish`>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match any paths from arrayOptionalObjects with numeric index', () => {
      expectTypeOf<'arrayOptionalObjects.0.strRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrayOptionalObjects.0.strOptional'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match any paths from arrayNullableObjects (array is nullable)', () => {
      expectTypeOf<`arrayNullableObjects.${number}.strRequired`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayNullableObjects.${number}.strOptional`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayNullableObjects.${number}.strNullable`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayNullableObjects.${number}.strNullish`>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match any paths from arrayNullableObjects with numeric index', () => {
      expectTypeOf<'arrayNullableObjects.0.strRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrayNullableObjects.0.strNullable'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match any paths from arrayNullishObjects (array is nullish)', () => {
      expectTypeOf<`arrayNullishObjects.${number}.strRequired`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayNullishObjects.${number}.strOptional`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayNullishObjects.${number}.strNullable`>().not.toExtend<TightStringPaths>();
      expectTypeOf<`arrayNullishObjects.${number}.strNullish`>().not.toExtend<TightStringPaths>();
    });

    it('should NOT match any paths from arrayNullishObjects with numeric index', () => {
      expectTypeOf<'arrayNullishObjects.0.strRequired'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'arrayNullishObjects.0.strNullish'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('non-strict mode - nested required object with inner field variants', () => {
    type LooseStringPaths = Paths<NestedSchema, string, false>;

    it('should match all inner fields from nestedRequiredObj (string is part of all unions)', () => {
      expectTypeOf<'nestedRequiredObj.strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedRequiredObj.strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedRequiredObj.strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedRequiredObj.strNullish'>().toExtend<LooseStringPaths>();
    });
  });

  describe('non-strict mode - nested optional/nullable/nullish objects', () => {
    type LooseStringPaths = Paths<NestedSchema, string, false>;

    it('should match all paths from nestedOptionalObj', () => {
      expectTypeOf<'nestedOptionalObj.strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedOptionalObj.strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedOptionalObj.strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedOptionalObj.strNullish'>().toExtend<LooseStringPaths>();
    });

    it('should match all paths from nestedNullableObj', () => {
      expectTypeOf<'nestedNullableObj.strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedNullableObj.strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedNullableObj.strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedNullableObj.strNullish'>().toExtend<LooseStringPaths>();
    });

    it('should match all paths from nestedNullishObj', () => {
      expectTypeOf<'nestedNullishObj.strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedNullishObj.strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedNullishObj.strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nestedNullishObj.strNullish'>().toExtend<LooseStringPaths>();
    });
  });

  describe('non-strict mode - array of objects with inner field variants', () => {
    type LooseStringPaths = Paths<NestedSchema, string, false>;

    it('should match all inner fields from arrayOfObjects elements', () => {
      expectTypeOf<`arrayOfObjects.${number}.strRequired`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayOfObjects.${number}.strOptional`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayOfObjects.${number}.strNullable`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayOfObjects.${number}.strNullish`>().toExtend<LooseStringPaths>();
    });

    it('should match all inner fields with numeric index', () => {
      expectTypeOf<'arrayOfObjects.0.strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayOfObjects.0.strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayOfObjects.0.strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayOfObjects.0.strNullish'>().toExtend<LooseStringPaths>();
    });
  });

  describe('non-strict mode - optional/nullable/nullish arrays of objects', () => {
    type LooseStringPaths = Paths<NestedSchema, string, false>;

    it('should match all paths from arrayOptionalObjects', () => {
      expectTypeOf<`arrayOptionalObjects.${number}.strRequired`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayOptionalObjects.${number}.strOptional`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayOptionalObjects.${number}.strNullable`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayOptionalObjects.${number}.strNullish`>().toExtend<LooseStringPaths>();
    });

    it('should match all paths from arrayOptionalObjects with numeric index', () => {
      expectTypeOf<'arrayOptionalObjects.0.strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayOptionalObjects.0.strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayOptionalObjects.0.strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayOptionalObjects.0.strNullish'>().toExtend<LooseStringPaths>();
    });

    it('should match all paths from arrayNullableObjects', () => {
      expectTypeOf<`arrayNullableObjects.${number}.strRequired`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayNullableObjects.${number}.strOptional`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayNullableObjects.${number}.strNullable`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayNullableObjects.${number}.strNullish`>().toExtend<LooseStringPaths>();
    });

    it('should match all paths from arrayNullableObjects with numeric index', () => {
      expectTypeOf<'arrayNullableObjects.0.strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayNullableObjects.0.strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayNullableObjects.0.strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayNullableObjects.0.strNullish'>().toExtend<LooseStringPaths>();
    });

    it('should match all paths from arrayNullishObjects', () => {
      expectTypeOf<`arrayNullishObjects.${number}.strRequired`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayNullishObjects.${number}.strOptional`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayNullishObjects.${number}.strNullable`>().toExtend<LooseStringPaths>();
      expectTypeOf<`arrayNullishObjects.${number}.strNullish`>().toExtend<LooseStringPaths>();
    });

    it('should match all paths from arrayNullishObjects with numeric index', () => {
      expectTypeOf<'arrayNullishObjects.0.strRequired'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayNullishObjects.0.strOptional'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayNullishObjects.0.strNullable'>().toExtend<LooseStringPaths>();
      expectTypeOf<'arrayNullishObjects.0.strNullish'>().toExtend<LooseStringPaths>();
    });
  });
});

describe('Filter type behavior: unknown vs Tight vs Loose', () => {
  // This tests the three distinct behaviors:
  // 1. unknown (unset) filter type -> allows ALL paths regardless of parent optionality
  // 2. Filter type + strict=true (Tight) -> won't allow if parent is optional/nullable
  // 3. Filter type + strict=false (Loose) -> allows optional/nullable parents but only for matching filter type

  type SchemaWithOptionalParent = {
    required: {
      name: string;
      count: number;
    };
    optional?: {
      name: string;
      count: number;
    };
    nullable: {
      name: string;
      count: number;
    } | null;
    nullish?: {
      name: string;
      count: number;
    } | null;
  };

  describe('unknown filter type (unset) - allows ALL paths', () => {
    type AllPaths = Paths<SchemaWithOptionalParent>;

    it('should include paths from required parent', () => {
      expectTypeOf<'required'>().toExtend<AllPaths>();
      expectTypeOf<'required.name'>().toExtend<AllPaths>();
      expectTypeOf<'required.count'>().toExtend<AllPaths>();
    });

    it('should include paths from optional parent', () => {
      expectTypeOf<'optional'>().toExtend<AllPaths>();
      expectTypeOf<'optional.name'>().toExtend<AllPaths>();
      expectTypeOf<'optional.count'>().toExtend<AllPaths>();
    });

    it('should include paths from nullable parent', () => {
      expectTypeOf<'nullable'>().toExtend<AllPaths>();
      expectTypeOf<'nullable.name'>().toExtend<AllPaths>();
      expectTypeOf<'nullable.count'>().toExtend<AllPaths>();
    });

    it('should include paths from nullish parent', () => {
      expectTypeOf<'nullish'>().toExtend<AllPaths>();
      expectTypeOf<'nullish.name'>().toExtend<AllPaths>();
      expectTypeOf<'nullish.count'>().toExtend<AllPaths>();
    });
  });

  describe('Tight filter (strict=true) - blocks paths through optional/nullable parents', () => {
    type TightStringPaths = Paths<SchemaWithOptionalParent, string>;

    it('should include string paths from required parent', () => {
      expectTypeOf<'required.name'>().toExtend<TightStringPaths>();
    });

    it('should NOT include string paths from optional parent', () => {
      expectTypeOf<'optional.name'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT include string paths from nullable parent', () => {
      expectTypeOf<'nullable.name'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT include string paths from nullish parent', () => {
      expectTypeOf<'nullish.name'>().not.toExtend<TightStringPaths>();
    });

    it('should NOT include number paths at all (wrong type)', () => {
      expectTypeOf<'required.count'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'optional.count'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nullable.count'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nullish.count'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('Loose filter (strict=false) - allows optional/nullable parents for matching type', () => {
    type LooseStringPaths = Paths<SchemaWithOptionalParent, string, false>;

    it('should include string paths from required parent', () => {
      expectTypeOf<'required.name'>().toExtend<LooseStringPaths>();
    });

    it('should include string paths from optional parent', () => {
      expectTypeOf<'optional.name'>().toExtend<LooseStringPaths>();
    });

    it('should include string paths from nullable parent', () => {
      expectTypeOf<'nullable.name'>().toExtend<LooseStringPaths>();
    });

    it('should include string paths from nullish parent', () => {
      expectTypeOf<'nullish.name'>().toExtend<LooseStringPaths>();
    });

    it('should NOT include number paths (wrong type, even with loose mode)', () => {
      expectTypeOf<'required.count'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'optional.count'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'nullable.count'>().not.toExtend<LooseStringPaths>();
      expectTypeOf<'nullish.count'>().not.toExtend<LooseStringPaths>();
    });
  });

  describe('comparison: all three modes side by side', () => {
    type AllPaths = Paths<SchemaWithOptionalParent>; // unknown filter
    type TightStringPaths = Paths<SchemaWithOptionalParent, string>; // strict=true
    type LooseStringPaths = Paths<SchemaWithOptionalParent, string, false>; // strict=false

    it('unknown allows optional.name, Tight blocks it, Loose allows it', () => {
      expectTypeOf<'optional.name'>().toExtend<AllPaths>();
      expectTypeOf<'optional.name'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'optional.name'>().toExtend<LooseStringPaths>();
    });

    it('unknown allows optional.count, but both Tight and Loose block it (wrong type)', () => {
      expectTypeOf<'optional.count'>().toExtend<AllPaths>();
      expectTypeOf<'optional.count'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'optional.count'>().not.toExtend<LooseStringPaths>();
    });

    it('all three allow required.name (required parent, matching type)', () => {
      expectTypeOf<'required.name'>().toExtend<AllPaths>();
      expectTypeOf<'required.name'>().toExtend<TightStringPaths>();
      expectTypeOf<'required.name'>().toExtend<LooseStringPaths>();
    });
  });

  describe('with arrays - unknown vs Tight vs Loose', () => {
    type SchemaWithOptionalArray = {
      requiredArray: string[];
      optionalArray?: string[];
      nullableArray: string[] | null;
      nullishArray?: string[] | null;
    };

    describe('unknown filter allows all array element paths', () => {
      type AllPaths = Paths<SchemaWithOptionalArray>;

      it('should include all array element paths', () => {
        expectTypeOf<'requiredArray.0'>().toExtend<AllPaths>();
        expectTypeOf<'optionalArray.0'>().toExtend<AllPaths>();
        expectTypeOf<'nullableArray.0'>().toExtend<AllPaths>();
        expectTypeOf<'nullishArray.0'>().toExtend<AllPaths>();
      });

      it('should include template literal paths', () => {
        expectTypeOf<`requiredArray.${number}`>().toExtend<AllPaths>();
        expectTypeOf<`optionalArray.${number}`>().toExtend<AllPaths>();
        expectTypeOf<`nullableArray.${number}`>().toExtend<AllPaths>();
        expectTypeOf<`nullishArray.${number}`>().toExtend<AllPaths>();
      });
    });

    describe('Tight filter blocks optional/nullable array element paths', () => {
      type TightStringPaths = Paths<SchemaWithOptionalArray, string>;

      it('should include element paths from required array', () => {
        expectTypeOf<'requiredArray.0'>().toExtend<TightStringPaths>();
        expectTypeOf<`requiredArray.${number}`>().toExtend<TightStringPaths>();
      });

      it('should NOT include element paths from optional array', () => {
        expectTypeOf<'optionalArray.0'>().not.toExtend<TightStringPaths>();
        expectTypeOf<`optionalArray.${number}`>().not.toExtend<TightStringPaths>();
      });

      it('should NOT include element paths from nullable array', () => {
        expectTypeOf<'nullableArray.0'>().not.toExtend<TightStringPaths>();
        expectTypeOf<`nullableArray.${number}`>().not.toExtend<TightStringPaths>();
      });

      it('should NOT include element paths from nullish array', () => {
        expectTypeOf<'nullishArray.0'>().not.toExtend<TightStringPaths>();
        expectTypeOf<`nullishArray.${number}`>().not.toExtend<TightStringPaths>();
      });
    });

    describe('Loose filter allows optional/nullable array element paths', () => {
      type LooseStringPaths = Paths<SchemaWithOptionalArray, string, false>;

      it('should include all array element paths', () => {
        expectTypeOf<'requiredArray.0'>().toExtend<LooseStringPaths>();
        expectTypeOf<'optionalArray.0'>().toExtend<LooseStringPaths>();
        expectTypeOf<'nullableArray.0'>().toExtend<LooseStringPaths>();
        expectTypeOf<'nullishArray.0'>().toExtend<LooseStringPaths>();
      });

      it('should include all template literal paths', () => {
        expectTypeOf<`requiredArray.${number}`>().toExtend<LooseStringPaths>();
        expectTypeOf<`optionalArray.${number}`>().toExtend<LooseStringPaths>();
        expectTypeOf<`nullableArray.${number}`>().toExtend<LooseStringPaths>();
        expectTypeOf<`nullishArray.${number}`>().toExtend<LooseStringPaths>();
      });
    });
  });

  describe('with deeply nested optional parents', () => {
    type DeeplyNested = {
      level1: {
        level2?: {
          level3: {
            value: string;
            count: number;
          };
        };
      };
    };

    it('unknown filter allows deeply nested paths through optional', () => {
      type AllPaths = Paths<DeeplyNested>;
      expectTypeOf<'level1.level2.level3.value'>().toExtend<AllPaths>();
      expectTypeOf<'level1.level2.level3.count'>().toExtend<AllPaths>();
    });

    it('Tight filter blocks paths through optional level', () => {
      type TightStringPaths = Paths<DeeplyNested, string>;
      expectTypeOf<'level1.level2.level3.value'>().not.toExtend<TightStringPaths>();
    });

    it('Loose filter allows paths through optional level for matching type', () => {
      type LooseStringPaths = Paths<DeeplyNested, string, false>;
      expectTypeOf<'level1.level2.level3.value'>().toExtend<LooseStringPaths>();
    });

    it('Loose filter still blocks wrong type even through optional', () => {
      type LooseStringPaths = Paths<DeeplyNested, string, false>;
      expectTypeOf<'level1.level2.level3.count'>().not.toExtend<LooseStringPaths>();
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

describe('Tuple types', () => {
  describe('fixed-length tuples', () => {
    type TupleSchema = {
      pair: [string, number];
      triple: [string, number, boolean];
      mixed: [{ name: string }, number];
    };

    describe('unknown filter (all paths)', () => {
      type AllPaths = Paths<TupleSchema>;

      it('should include tuple root paths', () => {
        expectTypeOf<'pair'>().toExtend<AllPaths>();
        expectTypeOf<'triple'>().toExtend<AllPaths>();
        expectTypeOf<'mixed'>().toExtend<AllPaths>();
      });

      it('should include tuple element paths with specific indices', () => {
        expectTypeOf<'pair.0'>().toExtend<AllPaths>();
        expectTypeOf<'pair.1'>().toExtend<AllPaths>();
        expectTypeOf<'triple.0'>().toExtend<AllPaths>();
        expectTypeOf<'triple.1'>().toExtend<AllPaths>();
        expectTypeOf<'triple.2'>().toExtend<AllPaths>();
      });

      it('should include nested paths in tuple elements', () => {
        expectTypeOf<'mixed.0'>().toExtend<AllPaths>();
        expectTypeOf<'mixed.0.name'>().toExtend<AllPaths>();
        expectTypeOf<'mixed.1'>().toExtend<AllPaths>();
      });
    });

    describe('Tight filter with tuples', () => {
      it('should filter tuple elements by type', () => {
        type TightStringPaths = Paths<TupleSchema, string>;

        expectTypeOf<'pair.0'>().toExtend<TightStringPaths>();
        expectTypeOf<'triple.0'>().toExtend<TightStringPaths>();
        expectTypeOf<'mixed.0.name'>().toExtend<TightStringPaths>();
      });

      it('should NOT include non-matching tuple elements', () => {
        type TightStringPaths = Paths<TupleSchema, string>;

        expectTypeOf<'pair.1'>().not.toExtend<TightStringPaths>(); // number
        expectTypeOf<'triple.1'>().not.toExtend<TightStringPaths>(); // number
        expectTypeOf<'triple.2'>().not.toExtend<TightStringPaths>(); // boolean
      });

      it('should filter for number type', () => {
        type TightNumberPaths = Paths<TupleSchema, number>;

        expectTypeOf<'pair.1'>().toExtend<TightNumberPaths>();
        expectTypeOf<'triple.1'>().toExtend<TightNumberPaths>();
        expectTypeOf<'mixed.1'>().toExtend<TightNumberPaths>();
      });

      it('should filter for boolean type', () => {
        type TightBooleanPaths = Paths<TupleSchema, boolean>;

        expectTypeOf<'triple.2'>().toExtend<TightBooleanPaths>();
        expectTypeOf<'pair.0'>().not.toExtend<TightBooleanPaths>();
      });
    });
  });

  describe('optional tuple elements', () => {
    type OptionalTupleSchema = {
      required: [string, number];
      optional?: [string, number];
      nullable: [string, number] | null;
    };

    it('unknown filter allows all tuple paths', () => {
      type AllPaths = Paths<OptionalTupleSchema>;

      expectTypeOf<'required.0'>().toExtend<AllPaths>();
      expectTypeOf<'optional.0'>().toExtend<AllPaths>();
      expectTypeOf<'nullable.0'>().toExtend<AllPaths>();
    });

    it('Tight filter blocks paths through optional/nullable tuples', () => {
      type TightStringPaths = Paths<OptionalTupleSchema, string>;

      expectTypeOf<'required.0'>().toExtend<TightStringPaths>();
      expectTypeOf<'optional.0'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'nullable.0'>().not.toExtend<TightStringPaths>();
    });

    it('Loose filter allows paths through optional/nullable tuples', () => {
      type LooseStringPaths = Paths<OptionalTupleSchema, string, false>;

      expectTypeOf<'required.0'>().toExtend<LooseStringPaths>();
      expectTypeOf<'optional.0'>().toExtend<LooseStringPaths>();
      expectTypeOf<'nullable.0'>().toExtend<LooseStringPaths>();
    });
  });
});

describe('BrowserNativeObject types', () => {
  type NativeSchema = {
    createdAt: Date;
    file: File;
    files: FileList;
    name: string;
  };

  describe('unknown filter includes native objects', () => {
    type AllPaths = Paths<NativeSchema>;

    it('should include Date paths', () => {
      expectTypeOf<'createdAt'>().toExtend<AllPaths>();
    });

    it('should include File paths', () => {
      expectTypeOf<'file'>().toExtend<AllPaths>();
    });

    it('should include FileList paths', () => {
      expectTypeOf<'files'>().toExtend<AllPaths>();
    });

    it('should NOT recurse into Date/File/FileList (they are primitives)', () => {
      // Date has methods like getTime, but they should not be traversed
      expectTypeOf<'createdAt.getTime'>().not.toExtend<AllPaths>();
    });
  });

  describe('filtering for Date type', () => {
    it('Tight filter matches Date fields', () => {
      type TightDatePaths = Paths<NativeSchema, Date>;

      expectTypeOf<'createdAt'>().toExtend<TightDatePaths>();
      expectTypeOf<'name'>().not.toExtend<TightDatePaths>();
      expectTypeOf<'file'>().not.toExtend<TightDatePaths>();
    });
  });

  describe('filtering for File type', () => {
    it('Tight filter matches File fields', () => {
      type TightFilePaths = Paths<NativeSchema, File>;

      expectTypeOf<'file'>().toExtend<TightFilePaths>();
      expectTypeOf<'createdAt'>().not.toExtend<TightFilePaths>();
    });
  });

  describe('optional Date fields', () => {
    type OptionalDateSchema = {
      required: Date;
      optional?: Date;
      nullable: Date | null;
    };

    it('Tight filter blocks optional/nullable Date', () => {
      type TightDatePaths = Paths<OptionalDateSchema, Date>;

      expectTypeOf<'required'>().toExtend<TightDatePaths>();
      expectTypeOf<'optional'>().not.toExtend<TightDatePaths>();
      expectTypeOf<'nullable'>().not.toExtend<TightDatePaths>();
    });

    it('Loose filter allows optional/nullable Date', () => {
      type LooseDatePaths = Paths<OptionalDateSchema, Date, false>;

      expectTypeOf<'required'>().toExtend<LooseDatePaths>();
      expectTypeOf<'optional'>().toExtend<LooseDatePaths>();
      expectTypeOf<'nullable'>().toExtend<LooseDatePaths>();
    });
  });
});

describe('Circular/recursive type references', () => {
  // Circular types should not cause infinite recursion
  type TreeNode = {
    value: string;
    children: TreeNode[];
  };

  describe('tree structure', () => {
    it('should include first level paths', () => {
      type AllPaths = Paths<TreeNode>;

      expectTypeOf<'value'>().toExtend<AllPaths>();
      expectTypeOf<'children'>().toExtend<AllPaths>();
    });

    it('should not include nested paths through recursive types', () => {
      type AllPaths = Paths<TreeNode>;

      // First level children array element is allowed
      expectTypeOf<'children.0'>().toExtend<AllPaths>();
      // But nested paths through recursive type are NOT allowed
      expectTypeOf<'children.0.value'>().not.toExtend<AllPaths>();
      expectTypeOf<'children.0.children'>().not.toExtend<AllPaths>();
    });

    it('should filter recursive structure', () => {
      type TightStringPaths = Paths<TreeNode, string>;

      expectTypeOf<'value'>().toExtend<TightStringPaths>();
      // Nested paths through recursive type are NOT allowed
      expectTypeOf<'children.0.value'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'children'>().not.toExtend<TightStringPaths>();
    });
  });
});

describe('bigint and symbol primitives', () => {
  type PrimitiveSchema = {
    id: bigint;
    key: symbol;
    name: string;
    count: number;
  };

  describe('unknown filter includes all primitives', () => {
    type AllPaths = Paths<PrimitiveSchema>;

    it('should include bigint paths', () => {
      expectTypeOf<'id'>().toExtend<AllPaths>();
    });

    it('should include symbol paths', () => {
      expectTypeOf<'key'>().toExtend<AllPaths>();
    });
  });

  describe('filtering for bigint', () => {
    it('Tight filter matches bigint fields', () => {
      type TightBigintPaths = Paths<PrimitiveSchema, bigint>;

      expectTypeOf<'id'>().toExtend<TightBigintPaths>();
      expectTypeOf<'name'>().not.toExtend<TightBigintPaths>();
      expectTypeOf<'count'>().not.toExtend<TightBigintPaths>();
    });
  });

  describe('filtering for symbol', () => {
    it('Tight filter matches symbol fields', () => {
      type TightSymbolPaths = Paths<PrimitiveSchema, symbol>;

      expectTypeOf<'key'>().toExtend<TightSymbolPaths>();
      expectTypeOf<'id'>().not.toExtend<TightSymbolPaths>();
    });
  });

  describe('optional bigint/symbol', () => {
    type OptionalPrimitiveSchema = {
      requiredBigint: bigint;
      optionalBigint?: bigint;
      nullableBigint: bigint | null;
    };

    it('Tight filter blocks optional/nullable bigint', () => {
      type TightBigintPaths = Paths<OptionalPrimitiveSchema, bigint>;

      expectTypeOf<'requiredBigint'>().toExtend<TightBigintPaths>();
      expectTypeOf<'optionalBigint'>().not.toExtend<TightBigintPaths>();
      expectTypeOf<'nullableBigint'>().not.toExtend<TightBigintPaths>();
    });

    it('Loose filter allows optional/nullable bigint', () => {
      type LooseBigintPaths = Paths<OptionalPrimitiveSchema, bigint, false>;

      expectTypeOf<'requiredBigint'>().toExtend<LooseBigintPaths>();
      expectTypeOf<'optionalBigint'>().toExtend<LooseBigintPaths>();
      expectTypeOf<'nullableBigint'>().toExtend<LooseBigintPaths>();
    });
  });
});

describe('Readonly arrays', () => {
  type ReadonlySchema = {
    tags: readonly string[];
    items: readonly { id: number; name: string }[];
    mutableTags: string[];
  };

  describe('unknown filter includes readonly array paths', () => {
    type AllPaths = Paths<ReadonlySchema>;

    it('should include readonly array root', () => {
      expectTypeOf<'tags'>().toExtend<AllPaths>();
      expectTypeOf<'items'>().toExtend<AllPaths>();
    });

    it('should include readonly array element paths', () => {
      expectTypeOf<'tags.0'>().toExtend<AllPaths>();
      expectTypeOf<'items.0'>().toExtend<AllPaths>();
      expectTypeOf<'items.0.id'>().toExtend<AllPaths>();
      expectTypeOf<'items.0.name'>().toExtend<AllPaths>();
    });

    it('should include template literal paths', () => {
      expectTypeOf<`tags.${number}`>().toExtend<AllPaths>();
      expectTypeOf<`items.${number}`>().toExtend<AllPaths>();
      expectTypeOf<`items.${number}.id`>().toExtend<AllPaths>();
    });
  });

  describe('filtering readonly arrays', () => {
    it('Tight filter matches readonly string array elements', () => {
      type TightStringPaths = Paths<ReadonlySchema, string>;

      expectTypeOf<'tags.0'>().toExtend<TightStringPaths>();
      expectTypeOf<`tags.${number}`>().toExtend<TightStringPaths>();
      expectTypeOf<'items.0.name'>().toExtend<TightStringPaths>();
    });

    it('Tight filter matches mutable and readonly array elements equally', () => {
      type TightStringPaths = Paths<ReadonlySchema, string>;

      // Both mutable and readonly arrays should work the same
      expectTypeOf<'tags.0'>().toExtend<TightStringPaths>();
      expectTypeOf<'mutableTags.0'>().toExtend<TightStringPaths>();
    });
  });
});

describe('Union types at field level', () => {
  type UnionSchema = {
    // Union of primitives
    status: 'active' | 'inactive' | 'pending';
    // Union of different types
    idOrName: string | number;
    // Union including object
    dataOrNull: { value: string } | null;
    // Complex union
    response:
      | { success: true; data: string }
      | { success: false; error: string };
  };

  describe('unknown filter handles unions', () => {
    type AllPaths = Paths<UnionSchema>;

    it('should include union field paths', () => {
      expectTypeOf<'status'>().toExtend<AllPaths>();
      expectTypeOf<'idOrName'>().toExtend<AllPaths>();
      expectTypeOf<'dataOrNull'>().toExtend<AllPaths>();
      expectTypeOf<'response'>().toExtend<AllPaths>();
    });

    it('should include nested paths in union objects', () => {
      expectTypeOf<'dataOrNull.value'>().toExtend<AllPaths>();
      expectTypeOf<'response.success'>().toExtend<AllPaths>();
      // Common fields in union
      expectTypeOf<'response.data'>().toExtend<AllPaths>();
      expectTypeOf<'response.error'>().toExtend<AllPaths>();
    });
  });

  describe('Tight filter with union types', () => {
    it('should match exact union type', () => {
      type StatusPaths = Paths<UnionSchema, 'active' | 'inactive' | 'pending'>;

      expectTypeOf<'status'>().toExtend<StatusPaths>();
    });

    it('should NOT match partial union', () => {
      // Looking for just 'active', but field is 'active' | 'inactive' | 'pending'
      type ActiveOnlyPaths = Paths<UnionSchema, 'active'>;

      expectTypeOf<'status'>().not.toExtend<ActiveOnlyPaths>();
    });
  });

  describe('Loose filter with union types', () => {
    it('should match if any part of union extends filter', () => {
      type LooseStringPaths = Paths<UnionSchema, string, false>;

      // 'active' | 'inactive' | 'pending' - all extend string
      expectTypeOf<'status'>().toExtend<LooseStringPaths>();
      // string | number - string part extends string
      expectTypeOf<'idOrName'>().toExtend<LooseStringPaths>();
    });

    it('should match number in union', () => {
      type LooseNumberPaths = Paths<UnionSchema, number, false>;

      // string | number - number part extends number
      expectTypeOf<'idOrName'>().toExtend<LooseNumberPaths>();
      // But status is all strings
      expectTypeOf<'status'>().not.toExtend<LooseNumberPaths>();
    });
  });
});

describe('Record and index signature types', () => {
  type RecordSchema = {
    users: Record<string, { name: string; age: number }>;
    counts: Record<string, number>;
    simple: { [key: string]: string };
  };

  describe('unknown filter with Record types', () => {
    type AllPaths = Paths<RecordSchema>;

    it('should include Record root paths', () => {
      expectTypeOf<'users'>().toExtend<AllPaths>();
      expectTypeOf<'counts'>().toExtend<AllPaths>();
      expectTypeOf<'simple'>().toExtend<AllPaths>();
    });

    // Note: Record<string, T> has string index signature
    // The Paths type may or may not handle this depending on implementation
  });
});

describe('never and unknown field types', () => {
  type NeverUnknownSchema = {
    normal: string;
    unknownField: unknown;
    neverField: never;
  };

  describe('unknown filter', () => {
    type AllPaths = Paths<NeverUnknownSchema>;

    it('should include normal fields', () => {
      expectTypeOf<'normal'>().toExtend<AllPaths>();
    });

    it('should include unknown field', () => {
      expectTypeOf<'unknownField'>().toExtend<AllPaths>();
    });

    // never fields typically don't appear in paths
  });

  describe('filtering with unknown field', () => {
    it('Tight filter can match unknown with unknown', () => {
      type UnknownPaths = Paths<NeverUnknownSchema, unknown>;

      // unknown extends unknown
      expectTypeOf<'unknownField'>().toExtend<UnknownPaths>();
      // string extends unknown
      expectTypeOf<'normal'>().toExtend<UnknownPaths>();
    });
  });
});

describe('Mixed nested structures', () => {
  type ComplexNested = {
    level1: {
      level2Array: {
        level3: string;
        level3Optional?: number;
      }[];
      level2Optional?: {
        level3: boolean;
      };
    };
    level1Optional?: {
      level2: {
        level3Array: string[];
      };
    };
  };

  describe('unknown filter traverses all levels', () => {
    type AllPaths = Paths<ComplexNested>;

    it('should include deeply nested paths', () => {
      expectTypeOf<'level1.level2Array.0.level3'>().toExtend<AllPaths>();
      expectTypeOf<'level1.level2Array.0.level3Optional'>().toExtend<AllPaths>();
      expectTypeOf<'level1.level2Optional.level3'>().toExtend<AllPaths>();
    });

    it('should include paths through optional level1', () => {
      expectTypeOf<'level1Optional.level2.level3Array.0'>().toExtend<AllPaths>();
    });
  });

  describe('Tight filter blocks at first optional boundary', () => {
    type TightStringPaths = Paths<ComplexNested, string>;

    it('should include required path to string', () => {
      expectTypeOf<'level1.level2Array.0.level3'>().toExtend<TightStringPaths>();
    });

    it('should block optional inner fields', () => {
      expectTypeOf<'level1.level2Array.0.level3Optional'>().not.toExtend<TightStringPaths>();
    });

    it('should block paths through optional objects', () => {
      expectTypeOf<'level1.level2Optional.level3'>().not.toExtend<TightStringPaths>();
      expectTypeOf<'level1Optional.level2.level3Array.0'>().not.toExtend<TightStringPaths>();
    });
  });

  describe('Loose filter allows through optional boundaries for matching type', () => {
    type LooseStringPaths = Paths<ComplexNested, string, false>;

    it('should include all string paths regardless of optional boundaries', () => {
      expectTypeOf<'level1.level2Array.0.level3'>().toExtend<LooseStringPaths>();
      expectTypeOf<'level1Optional.level2.level3Array.0'>().toExtend<LooseStringPaths>();
    });

    it('should still block non-matching types', () => {
      // level3Optional is number | undefined, not string
      expectTypeOf<'level1.level2Array.0.level3Optional'>().not.toExtend<LooseStringPaths>();
      // level3 under level2Optional is boolean
      expectTypeOf<'level1.level2Optional.level3'>().not.toExtend<LooseStringPaths>();
    });
  });
});

describe('SchemaField', () => {
  it('should wrap schema in object with schema property', () => {
    const schema = z.object({ name: z.string() });
    type Props = SchemaField<typeof schema>;

    expectTypeOf<Props>().toEqualTypeOf<{ schema: typeof schema }>();
  });

  it('should work with any Zod type', () => {
    const stringSchema = z.string();
    const arraySchema = z.array(z.number());

    type StringProps = SchemaField<typeof stringSchema>;
    type ArrayProps = SchemaField<typeof arraySchema>;

    expectTypeOf<StringProps>().toEqualTypeOf<{
      schema: typeof stringSchema;
    }>();
    expectTypeOf<ArrayProps>().toEqualTypeOf<{ schema: typeof arraySchema }>();
  });

  it('should work with discriminated union', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);
    type Props = SchemaField<typeof schema>;

    expectTypeOf<Props>().toEqualTypeOf<{ schema: typeof schema }>();
  });
});

describe('NameField', () => {
  describe('with regular schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      active: z.boolean(),
    });

    it('should have name constrained to valid paths', () => {
      type Props = NameField<typeof schema, 'name' | 'age' | 'active'>;

      expectTypeOf<Props>().toEqualTypeOf<{
        name: 'name' | 'age' | 'active';
      }>();
    });
  });

  describe('with nested schema', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        profile: z.object({
          bio: z.string(),
        }),
      }),
    });

    it('should include nested paths', () => {
      type Props = NameField<
        typeof schema,
        'user' | 'user.name' | 'user.profile' | 'user.profile.bio'
      >;

      expectTypeOf<Props>().toEqualTypeOf<{
        name: 'user' | 'user.name' | 'user.profile' | 'user.profile.bio';
      }>();
    });
  });

  describe('with discriminated union', () => {
    const schema = z.discriminatedUnion('mode', [
      z.object({ mode: z.literal('create'), name: z.string() }),
      z.object({ mode: z.literal('edit'), id: z.number() }),
    ]);

    it('should narrow paths based on discriminator value', () => {
      type CreateProps = NameField<
        typeof schema,
        'mode' | 'name',
        'mode',
        'create'
      >;

      expectTypeOf<CreateProps>().toEqualTypeOf<{
        name: 'mode' | 'name';
      }>();
    });

    it('should narrow to edit paths', () => {
      type EditProps = NameField<typeof schema, 'mode' | 'id', 'mode', 'edit'>;

      expectTypeOf<EditProps>().toEqualTypeOf<{
        name: 'mode' | 'id';
      }>();
    });
  });

  describe('with filter type', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      count: z.number(),
    });

    it('should filter to number paths only', () => {
      type NumberProps = NameField<
        typeof schema,
        'age' | 'count',
        never,
        never,
        number
      >;

      expectTypeOf<NumberProps>().toEqualTypeOf<{
        name: 'age' | 'count';
      }>();
    });

    it('should filter to string paths only', () => {
      type StringProps = NameField<typeof schema, 'name', never, never, string>;

      expectTypeOf<StringProps>().toEqualTypeOf<{
        name: 'name';
      }>();
    });
  });
});
