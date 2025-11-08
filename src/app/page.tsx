'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { FormSchemaProvider } from '@/lib/form-schema-context';

// ==============================
// ==============================
// ==============================

const name = z.string().nonempty().default('');

const arr = z.array(z.string()).nonempty();

const getPrimitiveType = <T extends z.ZodTypeAny>(
  field: T,
  options?: {
    unwrapArrays?: boolean;
  },
) => {
  const unwrapArrays = options?.unwrapArrays ?? false;

  if (!unwrapArrays && field.type === 'array') {
    return field;
  }

  if ('unwrap' in field && typeof field.unwrap === 'function') {
    return getPrimitiveType(field.unwrap());
  }

  return field;
};

function removeDefault(field: z.ZodType): z.ZodType {
  if (field instanceof z.ZodDefault) {
    return field.unwrap() as z.ZodType;
  }

  if ('innerType' in field.def) {
    const inner = removeDefault(field.def.innerType as z.ZodType);
    // Reconstruct the wrapper with the modified inner type
    if (field instanceof z.ZodOptional) {
      return inner.optional();
    }
    if (field instanceof z.ZodNullable) {
      return inner.nullable();
    }
  }

  return field;
}

const checkIfFieldIsRequired = <T extends z.ZodTypeAny>(field: T) => {
  const undefinedResult = removeDefault(field).safeParse(undefined).success;
  const nullResult = field.safeParse(null).success;

  const primitiveType = getPrimitiveType(field);

  const emptyStringResult =
    primitiveType.type === 'string' && field.safeParse('').success;

  const emptyArrayResult =
    primitiveType.type === 'array' && field.safeParse([]).success;

  return (
    !undefinedResult && !nullResult && !emptyStringResult && !emptyArrayResult
  );
};

function extractDefault(field: z.ZodTypeAny): any {
  if (field instanceof z.ZodDefault) {
    const defaultValue = field._def.defaultValue;
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  }

  if ('unwrap' in field && typeof field.unwrap === 'function') {
    return extractDefault(field.unwrap());
  }

  return undefined;
}

function getUnwrappedType(field: z.ZodTypeAny): z.ZodTypeAny {
  if (field instanceof z.ZodDefault) {
    // Don't unwrap defaults - we want to preserve them
    return field;
  }

  if ('unwrap' in field && typeof field.unwrap === 'function') {
    return getUnwrappedType(field.unwrap());
  }

  return field;
}

function getSchemaDefaults<T extends z.ZodObject<any>>(
  schema: T,
): Partial<z.infer<T>> {
  const defaults: Record<string, any> = {};

  for (const key in schema.shape) {
    const field = schema.shape[key];

    // First, check if this field has an explicit default value
    const defaultValue = extractDefault(field);
    if (defaultValue !== undefined) {
      defaults[key] = defaultValue;
      continue;
    }

    // If no explicit default, check if it's a nested object with defaults
    const unwrapped = getUnwrappedType(field);
    if (unwrapped instanceof z.ZodObject) {
      const nestedDefaults = getSchemaDefaults(unwrapped);
      if (Object.keys(nestedDefaults).length > 0) {
        defaults[key] = nestedDefaults;
      }
    }
  }

  return defaults as Partial<z.infer<T>>;
}

// console.log(
//   '----- STRING',
//   checkIfFieldIsRequired(name) ? 'is Required' : 'is Optional',
// );
// console.log(
//   'DOUBLE CHECK ->',
//   name.safeParse('').success ? 'success' : 'validation error',
// );
// console.log('');

// console.log(
//   '----- ARRAY',
//   checkIfFieldIsRequired(arr) ? 'is Required' : 'is Optional',
// );
// console.log(
//   'DOUBLE CHECK ->',
//   arr.safeParse([]).success ? 'success' : 'validation error',
// );

// ==============================
// ==============================
// ==============================

const formSchema = z.object({
  title: z.string(),
  age: z.number().min(18).max(99),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.')
    .max(100, 'Description must be at most 100 characters.'),
  email: z.string().email('Please enter a valid email address.').optional(),
});

console.log(formSchema.safeParse({}));

console.log('--- Schema Defaults (empty for formSchema) ---');
console.log(getSchemaDefaults(formSchema));

// Test with a schema that has defaults
const schemaWithDefaults = z.object({
  name: z.string().default('John Doe'),
  age: z.number().default(25),
  active: z.boolean().default(true),
  role: z.string().optional().default('user'),
  email: z.string().email(), // no default
});

console.log('--- Schema With Defaults ---');
console.log(getSchemaDefaults(schemaWithDefaults));

// Test with nested objects
const nestedSchema = z.object({
  title: z.string(),
  user: z.object({
    name: z.string().default('Anonymous'),
    age: z.number().default(0),
    email: z.string().email(), // no default
  }),
  settings: z
    .object({
      theme: z.string().default('light'),
      notifications: z.boolean().default(true),
    })
    .optional(),
  tags: z.array(z.string()).default(['abcd']),
  metadata: z
    .object({
      created: z.string().default('2025-01-01'),
      nested: z.object({
        deep: z.string().default('deep value'),
      }),
    })
    .optional()
    .default({
      created: '2025-01-01',
      nested: { deep: 'deep value' },
    }),
});

console.log('--- Nested Schema Defaults ---');
console.log(JSON.stringify(getSchemaDefaults(nestedSchema), null, 2));

// Test with array of objects
const arrayOfObjectsSchema = z.object({
  name: z.string(),
  items: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().default('Untitled'),
        enabled: z.boolean().default(true),
      }),
    )
    .default([]),
  users: z
    .array(
      z.object({
        username: z.string().default('guest'),
        role: z.string().default('viewer'),
      }),
    )
    .default([
      { username: 'admin', role: 'admin' },
      { username: 'user1', role: 'viewer' },
    ]),
  tags: z.array(z.string()).default(['default-tag']),
});

console.log('--- Array of Objects Schema Defaults ---');
console.log(JSON.stringify(getSchemaDefaults(arrayOfObjectsSchema), null, 2));

export default function BugReportForm() {
  const form = useForm<
    z.infer<typeof formSchema>,
    unknown,
    {
      title?: string;
      age: number;
      description: string;
      email?: string | undefined;
    }
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      age: 1,
      description: '',
      email: '',
    },
  });

  const clearField = () => {
    console.log('testing');
  };

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast('You submitted the following values:', {
      description: (
        <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: 'bottom-right',
      classNames: {
        content: 'flex flex-col gap-2',
      },
      style: {
        '--border-radius': 'calc(var(--radius)  + 4px)',
      } as React.CSSProperties,
    });
  }

  return (
    <FormSchemaProvider schema={formSchema}>
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Bug Report</CardTitle>
          <CardDescription>
            Help us improve by reporting bugs you encounter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-title" fieldName="title">
                      Bug Title
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-title"
                      aria-invalid={fieldState.invalid}
                      placeholder="Login button not working on mobile"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="form-rhf-demo-description"
                      fieldName="description"
                    >
                      Description
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        {...field}
                        id="form-rhf-demo-description"
                        placeholder="I'm having an issue with the login button on mobile."
                        rows={6}
                        className="min-h-24 resize-none"
                        aria-invalid={fieldState.invalid}
                      />
                      <InputGroupAddon align="block-end">
                        <InputGroupText className="tabular-nums">
                          {field.value?.length}/100 characters
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Include steps to reproduce, expected behavior, and what
                      actually happened.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-email" fieldName="email">
                      Contact Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="your.email@example.com"
                      autoComplete="email"
                    />
                    <FieldDescription>
                      Optional. We&apos;ll use this to follow up on your bug
                      report.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field orientation="horizontal">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button type="submit" form="form-rhf-demo">
              Submit
            </Button>
            <Button type="button" variant="destructive" onClick={clearField}>
              Clear Field
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </FormSchemaProvider>
  );
}
