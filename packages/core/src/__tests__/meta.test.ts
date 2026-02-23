import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { extractMeta, getMergedSchemaDefaults, getSchemaMeta } from '../meta';

describe('extractMeta', () => {
  it('should extract meta value for a given key', () => {
    const field = z.string().meta({ label: 'Name' });
    expect(extractMeta(field, 'label')).toBe('Name');
  });

  it('should return undefined if meta key does not exist', () => {
    const field = z.string().meta({ label: 'Name' });
    expect(extractMeta(field, 'placeholder')).toBeUndefined();
  });

  it('should return undefined if field has no meta', () => {
    const field = z.string();
    expect(extractMeta(field, 'label')).toBeUndefined();
  });

  it('should extract meta from field wrapped in optional', () => {
    const field = z.string().meta({ label: 'Name' }).optional();
    expect(extractMeta(field, 'label')).toBe('Name');
  });

  it('should extract meta from field wrapped in nullable', () => {
    const field = z.string().meta({ label: 'Name' }).nullable();
    expect(extractMeta(field, 'label')).toBe('Name');
  });

  it('should extract meta from field wrapped in default', () => {
    const field = z.string().meta({ label: 'Name' }).default('hello');
    expect(extractMeta(field, 'label')).toBe('Name');
  });

  it('should extract meta from deeply nested wrappers', () => {
    const field = z.string().meta({ label: 'Name' }).optional().nullable();
    expect(extractMeta(field, 'label')).toBe('Name');
  });

  it('should extract meta from field with transform (ZodPipe)', () => {
    const field = z.string().meta({ label: 'Count' }).transform(Number);
    expect(extractMeta(field, 'label')).toBe('Count');
  });

  it('should extract meta from union with nullish types stripped', () => {
    const field = z.union([z.string().meta({ label: 'Name' }), z.null()]);
    expect(extractMeta(field, 'label')).toBe('Name');
  });

  it('should return undefined for union with multiple non-nullish types', () => {
    const field = z.union([
      z.string().meta({ label: 'Name' }),
      z.number().meta({ label: 'Age' }),
    ]);
    expect(extractMeta(field, 'label')).toBeUndefined();
  });

  it('should stop recursion when ZodObject has the target meta key', () => {
    const field = z
      .object({
        city: z.string().meta({ label: 'City' }),
      })
      .meta({ label: 'Address' });
    expect(extractMeta(field, 'label')).toBe('Address');
  });

  it('should recurse into ZodObject when it lacks the target meta key', () => {
    const field = z.object({
      city: z.string().meta({ label: 'City' }),
      zip: z.string().meta({ label: 'Zip' }),
    });
    expect(extractMeta(field, 'label')).toEqual({
      city: 'City',
      zip: 'Zip',
    });
  });

  it('should return undefined for ZodObject with no meta on any field', () => {
    const field = z.object({
      city: z.string(),
      zip: z.string(),
    });
    expect(extractMeta(field, 'label')).toBeUndefined();
  });

  it('should handle partial meta in nested objects', () => {
    const field = z.object({
      city: z.string().meta({ label: 'City' }),
      zip: z.string(), // no meta
    });
    expect(extractMeta(field, 'label')).toEqual({
      city: 'City',
    });
  });

  it('should recurse deeply into nested objects without the target key', () => {
    const field = z.object({
      address: z.object({
        city: z.string().meta({ label: 'City' }),
      }),
    });
    expect(extractMeta(field, 'label')).toEqual({
      address: { city: 'City' },
    });
  });

  it('should extract falsy meta values (false, 0, empty string)', () => {
    expect(extractMeta(z.string().meta({ hidden: false }), 'hidden')).toBe(
      false,
    );
    expect(extractMeta(z.string().meta({ order: 0 }), 'order')).toBe(0);
    expect(extractMeta(z.string().meta({ prefix: '' }), 'prefix')).toBe('');
  });

  it('should extract null meta values', () => {
    expect(extractMeta(z.string().meta({ label: null }), 'label')).toBeNull();
  });

  it('should skip falsy shape values (defensive guard)', () => {
    const field = z.object({
      valid: z.string().meta({ label: 'Valid' }),
    });
    Object.assign(field.shape, { invalid: undefined });
    expect(extractMeta(field, 'label')).toEqual({ valid: 'Valid' });
  });

  it('should extract meta from nested object with transform', () => {
    const field = z
      .object({
        theme: z.string().meta({ label: 'Theme' }),
      })
      .transform((s) => ({ ...s, applied: true }));
    expect(extractMeta(field, 'label')).toEqual({ theme: 'Theme' });
  });

  it('should extract meta from deeply nested objects with transforms at multiple levels', () => {
    const field = z
      .object({
        user: z
          .object({
            profile: z
              .object({
                bio: z.string().meta({ label: 'Bio' }),
              })
              .transform((p) => ({ ...p, length: p.bio.length })),
          })
          .transform((u) => ({ ...u, hasProfile: true })),
      })
      .transform((data) => ({ ...data, timestamp: Date.now() }));

    expect(extractMeta(field, 'label')).toEqual({
      user: {
        profile: {
          bio: 'Bio',
        },
      },
    });
  });

  it('should wrap array element meta in an array', () => {
    const field = z.array(z.string().meta({ label: 'Tag' }));
    expect(extractMeta(field, 'label')).toEqual(['Tag']);
  });

  it('should wrap array of objects element meta in an array', () => {
    const field = z.array(
      z.object({ name: z.string().meta({ label: 'Name' }) }),
    );
    expect(extractMeta(field, 'label')).toEqual([{ name: 'Name' }]);
  });

  it('should return array own meta directly (not wrapped)', () => {
    const field = z.array(z.string()).meta({ label: 'Tags' });
    expect(extractMeta(field, 'label')).toBe('Tags');
  });

  it('should return undefined for array with no meta anywhere', () => {
    const field = z.array(z.string());
    expect(extractMeta(field, 'label')).toBeUndefined();
  });
});

describe('getSchemaMeta', () => {
  it('should return empty object for non-object schema', () => {
    const schema = z.string().meta({ label: 'Name' });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({});
  });

  it('should return empty object for ZodArray schema', () => {
    const schema = z.array(z.string());
    expect(getSchemaMeta({ schema }, 'label')).toEqual({});
  });

  it('should wrap array field element meta in an array', () => {
    const schema = z.object({
      tags: z.array(z.string().meta({ label: 'Tag' })),
      items: z.array(z.object({ name: z.string().meta({ label: 'Name' }) })),
    });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({
      tags: ['Tag'],
      items: [{ name: 'Name' }],
    });
  });

  it('should extract meta from flat object schema', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }),
      age: z.number().meta({ label: 'Age' }),
    });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({
      name: 'Name',
      age: 'Age',
    });
  });

  it('should omit fields without the target meta key', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name', placeholder: 'Enter name' }),
      age: z.number().meta({ label: 'Age' }),
    });
    expect(getSchemaMeta({ schema }, 'placeholder')).toEqual({
      name: 'Enter name',
    });
  });

  it('should omit fields with no meta at all', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }),
      age: z.number(), // no meta
    });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({
      name: 'Name',
    });
  });

  it('should return empty object when no fields have the target meta key', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({});
  });

  it('should stop recursion when nested object has the target meta key', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }),
      address: z
        .object({
          city: z.string().meta({ label: 'City' }),
        })
        .meta({ label: 'Address' }),
    });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({
      name: 'Name',
      address: 'Address',
    });
  });

  it('should recurse into nested object without the target meta key', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }),
      address: z.object({
        city: z.string().meta({ label: 'City' }),
      }),
    });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({
      name: 'Name',
      address: { city: 'City' },
    });
  });

  it('should handle deeply nested objects', () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          settings: z.object({
            theme: z.string().meta({ label: 'Theme' }),
          }),
        }),
      }),
    });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({
      user: {
        profile: {
          settings: {
            theme: 'Theme',
          },
        },
      },
    });
  });

  it('should extract meta from wrapped fields (optional/nullable/default)', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }).optional(),
      age: z.number().meta({ label: 'Age' }).nullable(),
      role: z.string().meta({ label: 'Role' }).default('user'),
    });
    expect(getSchemaMeta({ schema }, 'label')).toEqual({
      name: 'Name',
      age: 'Age',
      role: 'Role',
    });
  });

  it('should handle schema with undefined field in shape', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }),
    });
    // @ts-expect-error - intentionally testing edge case
    schema.shape.missing = undefined;
    expect(getSchemaMeta({ schema }, 'label')).toEqual({ name: 'Name' });
  });

  describe('schemas with transforms', () => {
    it('should extract meta from object schema with transform', () => {
      const schema = z
        .object({
          name: z.string().meta({ label: 'Name' }),
          age: z.number().meta({ label: 'Age' }),
        })
        .transform((data) => ({ ...data, computed: true }));

      expect(getSchemaMeta({ schema }, 'label')).toEqual({
        name: 'Name',
        age: 'Age',
      });
    });

    it('should extract meta from nested object with transform', () => {
      const schema = z.object({
        name: z.string().meta({ label: 'Name' }),
        settings: z
          .object({
            theme: z.string().meta({ label: 'Theme' }),
          })
          .transform((s) => ({ ...s, applied: true })),
      });

      expect(getSchemaMeta({ schema }, 'label')).toEqual({
        name: 'Name',
        settings: { theme: 'Theme' },
      });
    });

    it('should extract meta through deeply nested transforms', () => {
      const schema = z
        .object({
          user: z
            .object({
              profile: z
                .object({
                  bio: z.string().meta({ label: 'Bio' }),
                })
                .transform((p) => ({ ...p, length: p.bio.length })),
            })
            .transform((u) => ({ ...u, hasProfile: true })),
        })
        .transform((data) => ({ ...data, timestamp: Date.now() }));

      expect(getSchemaMeta({ schema }, 'label')).toEqual({
        user: {
          profile: {
            bio: 'Bio',
          },
        },
      });
    });
  });

  describe('discriminated union schemas', () => {
    const userSchema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        name: z.string().meta({ label: 'Name' }),
      }),
      z.object({
        mode: z.literal('edit'),
        id: z.number().meta({ label: 'ID' }),
        name: z.string().meta({ label: 'Edit Name' }),
      }),
    ]);

    it('should extract meta for create mode', () => {
      expect(
        getSchemaMeta(
          {
            schema: userSchema,
            discriminator: { key: 'mode', value: 'create' },
          },
          'label',
        ),
      ).toEqual({ name: 'Name' });
    });

    it('should extract meta for edit mode', () => {
      expect(
        getSchemaMeta(
          { schema: userSchema, discriminator: { key: 'mode', value: 'edit' } },
          'label',
        ),
      ).toEqual({ id: 'ID', name: 'Edit Name' });
    });

    it('should return empty object for invalid discriminator value', () => {
      expect(
        getSchemaMeta(
          {
            schema: userSchema,
            discriminator: {
              key: 'mode',
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              value: 'invalid' as 'create' | 'edit',
            },
          },
          'label',
        ),
      ).toEqual({});
    });

    it('should return empty object when discriminator option has no meta', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('a'),
          value: z.string(),
        }),
        z.object({
          type: z.literal('b'),
          count: z.number(),
        }),
      ]);
      expect(
        getSchemaMeta(
          { schema, discriminator: { key: 'type', value: 'a' } },
          'label',
        ),
      ).toEqual({});
    });

    it('should extract meta from discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('mode', [
          z.object({
            mode: z.literal('create'),
            name: z.string().meta({ label: 'Name' }),
          }),
          z.object({
            mode: z.literal('edit'),
            id: z.number().meta({ label: 'ID' }),
          }),
        ])
        .transform((data) => ({ ...data, timestamp: Date.now() }));

      expect(
        getSchemaMeta(
          { schema, discriminator: { key: 'mode', value: 'create' } },
          'label',
        ),
      ).toEqual({ name: 'Name' });

      expect(
        getSchemaMeta(
          { schema, discriminator: { key: 'mode', value: 'edit' } },
          'label',
        ),
      ).toEqual({ id: 'ID' });
    });

    it('should handle nested objects in discriminated union', () => {
      const schema = z.discriminatedUnion('status', [
        z.object({
          status: z.literal('active'),
          settings: z.object({
            theme: z.string().meta({ label: 'Theme' }),
          }),
        }),
        z.object({
          status: z.literal('inactive'),
          reason: z.string().meta({ label: 'Reason' }),
        }),
      ]);

      expect(
        getSchemaMeta(
          { schema, discriminator: { key: 'status', value: 'active' } },
          'label',
        ),
      ).toEqual({ settings: { theme: 'Theme' } });
    });
  });
});

describe('getMergedSchemaDefaults', () => {
  it('should return meta values overriding defaults where both exist', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }).default('hello'),
      age: z.number().meta({ label: 'Age' }),
      bio: z.string().default(''),
    });
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
      name: 'Name',
      age: 'Age',
      bio: '',
    });
  });

  it('should return only defaults when no fields have the target meta key', () => {
    const schema = z.object({
      name: z.string().default('hello'),
      count: z.number().default(0),
    });
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
      name: 'hello',
      count: 0,
    });
  });

  it('should return only meta when no fields have defaults', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }),
      age: z.number().meta({ label: 'Age' }),
    });
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
      name: 'Name',
      age: 'Age',
    });
  });

  it('should return empty object when no fields have defaults or meta', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({});
  });

  it('should deep merge nested objects preserving both sources', () => {
    const schema = z.object({
      address: z.object({
        city: z.string().meta({ label: 'City' }).default('NYC'),
        zip: z.string().default('00000'),
        state: z.string().meta({ label: 'State' }),
      }),
    });
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
      address: {
        city: 'City',
        zip: '00000',
        state: 'State',
      },
    });
  });

  it('should handle array meta taking precedence over array default', () => {
    const schema = z.object({
      tags: z.array(z.string().meta({ label: 'Tag' })).default(['default-tag']),
    });
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
      tags: ['Tag'],
    });
  });

  it('should keep array defaults when no array meta exists', () => {
    const schema = z.object({
      tags: z.array(z.string()).default(['a', 'b']),
    });
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
      tags: ['a', 'b'],
    });
  });

  it('should handle wrapped fields (optional/nullable/default)', () => {
    const schema = z.object({
      name: z.string().meta({ label: 'Name' }).optional().default('hello'),
      age: z.number().meta({ label: 'Age' }).nullable(),
    });
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
      name: 'Name',
      age: 'Age',
    });
  });

  describe('schemas with transforms', () => {
    it('should merge defaults and meta from schema with transform', () => {
      const schema = z
        .object({
          name: z.string().meta({ label: 'Name' }).default('hello'),
          age: z.number().meta({ label: 'Age' }),
        })
        .transform((data) => ({ ...data, computed: true }));

      expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
        name: 'Name',
        age: 'Age',
      });
    });

    it('should merge through nested transforms', () => {
      const schema = z.object({
        settings: z
          .object({
            theme: z.string().meta({ label: 'Theme' }).default('light'),
            fontSize: z.number().default(14),
          })
          .transform((s) => ({ ...s, applied: true })),
      });

      expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({
        settings: {
          theme: 'Theme',
          fontSize: 14,
        },
      });
    });
  });

  describe('discriminated union schemas', () => {
    const userSchema = z.discriminatedUnion('mode', [
      z.object({
        mode: z.literal('create'),
        name: z.string().meta({ label: 'Name' }).default('New User'),
      }),
      z.object({
        mode: z.literal('edit'),
        id: z.number().meta({ label: 'ID' }),
        name: z.string().meta({ label: 'Edit Name' }).default(''),
      }),
    ]);

    it('should merge for create mode', () => {
      expect(
        getMergedSchemaDefaults(
          {
            schema: userSchema,
            discriminator: { key: 'mode', value: 'create' },
          },
          'label',
        ),
      ).toEqual({ name: 'Name' });
    });

    it('should merge for edit mode', () => {
      expect(
        getMergedSchemaDefaults(
          { schema: userSchema, discriminator: { key: 'mode', value: 'edit' } },
          'label',
        ),
      ).toEqual({ id: 'ID', name: 'Edit Name' });
    });

    it('should merge from discriminated union with transform', () => {
      const schema = z
        .discriminatedUnion('mode', [
          z.object({
            mode: z.literal('create'),
            name: z.string().meta({ label: 'Name' }).default('New'),
            count: z.number().default(0),
          }),
          z.object({
            mode: z.literal('edit'),
            id: z.number().meta({ label: 'ID' }),
          }),
        ])
        .transform((data) => ({ ...data, timestamp: Date.now() }));

      expect(
        getMergedSchemaDefaults(
          { schema, discriminator: { key: 'mode', value: 'create' } },
          'label',
        ),
      ).toEqual({ name: 'Name', count: 0 });
    });
  });

  it('should return empty object for non-object schema', () => {
    const schema = z.string().meta({ label: 'Name' }).default('hello');
    expect(getMergedSchemaDefaults({ schema }, 'label')).toEqual({});
  });
});
