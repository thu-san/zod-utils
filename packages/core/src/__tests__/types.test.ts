import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import type { ValidPathsOfType } from '../types';

describe('ValidPathsOfType', () => {
  describe('basic type filtering', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().optional(),
      count: z.number().nullable(),
      active: z.boolean(),
    });

    it('should extract string field paths', () => {
      type StringPaths = ValidPathsOfType<typeof schema, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<'name' | 'email'>();
    });

    it('should extract number field paths', () => {
      type NumberPaths = ValidPathsOfType<typeof schema, number>;

      expectTypeOf<NumberPaths>().toEqualTypeOf<'age' | 'count'>();
    });

    it('should extract boolean field paths', () => {
      type BooleanPaths = ValidPathsOfType<typeof schema, boolean>;

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
      type StringArrayPaths = ValidPathsOfType<typeof schema, string[]>;

      expectTypeOf<StringArrayPaths>().toEqualTypeOf<'tags'>();
    });

    it('should extract number array paths', () => {
      type NumberArrayPaths = ValidPathsOfType<typeof schema, number[]>;

      expectTypeOf<NumberArrayPaths>().toEqualTypeOf<'scores'>();
    });

    it('should extract object array paths', () => {
      type ObjectArrayPaths = ValidPathsOfType<typeof schema, { id: number }[]>;

      expectTypeOf<ObjectArrayPaths>().toEqualTypeOf<'items'>();
    });
  });

  describe('object type filtering', () => {
    const schema = z.object({
      name: z.string(),
      profile: z.object({
        bio: z.string(),
        avatar: z.string(),
      }),
      settings: z.object({
        theme: z.string(),
      }),
    });

    it('should extract object paths matching structure', () => {
      type ProfilePaths = ValidPathsOfType<
        typeof schema,
        { bio: string; avatar: string }
      >;

      expectTypeOf<ProfilePaths>().toEqualTypeOf<'profile'>();
    });

    it('should extract multiple object paths with same structure', () => {
      const schemaWithSameStructure = z.object({
        primary: z.object({ value: z.string() }),
        secondary: z.object({ value: z.string() }),
        count: z.number(),
      });

      type ObjectPaths = ValidPathsOfType<
        typeof schemaWithSameStructure,
        { value: string }
      >;

      expectTypeOf<ObjectPaths>().toEqualTypeOf<'primary' | 'secondary'>();
    });
  });

  describe('optional and nullable handling', () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
      nullish: z.string().nullish(),
      withDefault: z.string().default('test'),
    });

    it('should include optional fields', () => {
      type StringPaths = ValidPathsOfType<typeof schema, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<
        'required' | 'optional' | 'nullable' | 'nullish' | 'withDefault'
      >();
    });
  });

  describe('enum and literal handling', () => {
    it('should include enum fields when filtering for string (literals extend string)', () => {
      const schema = z.object({
        mode: z.enum(['create', 'edit']),
        name: z.string(),
      });

      // Both 'mode' and 'name' have types that extend string
      // (enum values 'create' | 'edit' extend string)
      type StringPaths = ValidPathsOfType<typeof schema, string>;
      expectTypeOf<StringPaths>().toEqualTypeOf<'mode' | 'name'>();
    });

    it('should filter specifically for enum values', () => {
      const schema = z.object({
        mode: z.enum(['create', 'edit']),
        name: z.string(),
        count: z.number(),
      });

      type EnumPaths = ValidPathsOfType<typeof schema, 'create' | 'edit'>;
      expectTypeOf<EnumPaths>().toEqualTypeOf<'mode'>();
    });
  });

  describe('complex real-world examples', () => {
    const userFormSchema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
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
        website: z.string().url().optional(),
      }),
      isActive: z.boolean(),
    });

    it('should extract all string paths including nested', () => {
      type StringPaths = ValidPathsOfType<typeof userFormSchema, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<
        | 'firstName'
        | 'lastName'
        | 'email'
        | 'profile.bio'
        | 'profile.website'
        | 'addresses.0.street'
        | 'addresses.0.city'
        | 'addresses.0.zip'
      >();
    });

    it('should extract all number paths', () => {
      type NumberPaths = ValidPathsOfType<typeof userFormSchema, number>;

      expectTypeOf<NumberPaths>().toEqualTypeOf<'age' | 'score'>();
    });

    it('should extract string array paths', () => {
      type StringArrayPaths = ValidPathsOfType<typeof userFormSchema, string[]>;

      expectTypeOf<StringArrayPaths>().toEqualTypeOf<'tags'>();
    });

    it('should extract address array paths', () => {
      type AddressPaths = ValidPathsOfType<
        typeof userFormSchema,
        { street: string; city: string; zip: string }[]
      >;

      expectTypeOf<AddressPaths>().toEqualTypeOf<'addresses'>();
    });
  });

  describe('nested path support', () => {
    it('should extract nested string paths from objects', () => {
      const schema = z.object({
        name: z.string(),
        profile: z.object({
          bio: z.string(),
          avatar: z.string(),
        }),
      });

      type StringPaths = ValidPathsOfType<typeof schema, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<
        'name' | 'profile.bio' | 'profile.avatar'
      >();
    });

    it('should extract nested number paths from objects', () => {
      const schema = z.object({
        count: z.number(),
        stats: z.object({
          views: z.number(),
          likes: z.number(),
        }),
      });

      type NumberPaths = ValidPathsOfType<typeof schema, number>;

      expectTypeOf<NumberPaths>().toEqualTypeOf<
        'count' | 'stats.views' | 'stats.likes'
      >();
    });

    it('should extract paths from nested arrays', () => {
      const schema = z.object({
        items: z.array(
          z.object({
            name: z.string(),
            price: z.number(),
          }),
        ),
      });

      type StringPaths = ValidPathsOfType<typeof schema, string>;
      type NumberPaths = ValidPathsOfType<typeof schema, number>;

      expectTypeOf<StringPaths>().toEqualTypeOf<'items.0.name'>();
      expectTypeOf<NumberPaths>().toEqualTypeOf<'items.0.price'>();
    });

    it('should extract deeply nested paths', () => {
      const schema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              value: z.string(),
            }),
          }),
        }),
      });

      type StringPaths = ValidPathsOfType<typeof schema, string>;

      expectTypeOf<StringPaths>().toEqualTypeOf<'level1.level2.level3.value'>();
    });

    it('should handle mixed nested types', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
          isActive: z.boolean(),
        }),
      });

      type StringPaths = ValidPathsOfType<typeof schema, string>;
      type NumberPaths = ValidPathsOfType<typeof schema, number>;
      type BooleanPaths = ValidPathsOfType<typeof schema, boolean>;

      expectTypeOf<StringPaths>().toEqualTypeOf<'user.name'>();
      expectTypeOf<NumberPaths>().toEqualTypeOf<'user.age'>();
      expectTypeOf<BooleanPaths>().toEqualTypeOf<'user.isActive'>();
    });
  });

  describe('edge cases', () => {
    it('should return never for non-matching types', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      type BooleanPaths = ValidPathsOfType<typeof schema, boolean>;

      expectTypeOf<BooleanPaths>().toBeNever();
    });

    it('should handle literal types', () => {
      const schema = z.object({
        status: z.literal('active'),
        mode: z.literal('edit'),
        count: z.number(),
      });

      type LiteralPaths = ValidPathsOfType<typeof schema, 'active'>;

      expectTypeOf<LiteralPaths>().toEqualTypeOf<'status'>();
    });

    it('should handle enum types', () => {
      const schema = z.object({
        status: z.enum(['active', 'inactive', 'pending']),
        name: z.string(),
      });

      type EnumPaths = ValidPathsOfType<
        typeof schema,
        'active' | 'inactive' | 'pending'
      >;

      expectTypeOf<EnumPaths>().toEqualTypeOf<'status'>();
    });
  });
});
