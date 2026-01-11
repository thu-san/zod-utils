'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// =============================================================================
// APPROACH: Nullish + Transform with ctx.addIssue()
// Validation AND type transformation in one step
//
// WHEN TO USE THIS APPROACH:
// - You have only ONE small form in your project
// - You want to avoid adding a dependency
// - You're okay with verbose schema definitions
//
// WHEN TO USE @zod-utils/react-hook-form INSTEAD:
// - You have multiple forms (2+)
// - You have discriminated union schemas
// - You want clean, readable schemas
// - You want getSchemaDefaults() helper
// - Better DX is more important than zero dependencies
// =============================================================================

// Helper for required string - validates and transforms
function requiredString(minLength = 1, message = 'This field is required') {
  return z
    .string()
    .nullish()
    .transform((val, ctx) => {
      if (!val || val.length < minLength) {
        ctx.addIssue({
          code: 'too_small',
          minimum: minLength,
          type: 'string',
          inclusive: true,
          message,
          origin: 'custom',
        });
        return '';
      }
      return val;
    });
}

// Helper for required number
function requiredNumber(message = 'This field is required') {
  return z
    .number()
    .nullish()
    .transform((val, ctx) => {
      if (val === null || val === undefined) {
        ctx.addIssue({
          code: 'invalid_type',
          expected: 'number',
          received: 'null',
          message,
          origin: 'custom',
        });
        return 0;
      }
      return val;
    });
}

// Helper for optional string
function optionalString() {
  return z
    .string()
    .nullish()
    .transform((val) => val ?? undefined);
}

// =============================================================================
// SCHEMA - Compare verbosity vs @zod-utils/react-hook-form approach:
//
// THIS APPROACH:
//   name: requiredString(1, 'Name is required')
//
// PACKAGE APPROACH:
//   name: z.string().min(1)  // Clean and idiomatic!
// =============================================================================

const userSchema = z
  .object({
    name: requiredString(1, 'Name is required'),
    email: requiredString(1, 'Email is required'),
    bio: optionalString(),
    age: requiredNumber('Age is required'),
    address: z
      .object({
        street: requiredString(1, 'Street is required'),
        city: requiredString(1, 'City is required'),
      })
      .nullish()
      .transform((val, ctx) => {
        if (!val) {
          ctx.addIssue({
            code: 'invalid_type',
            expected: 'object',
            received: 'null',
            message: 'Address is required',
            origin: 'custom',
          });
          return { street: '', city: '' };
        }
        return val;
      }),
  })
  .transform((data) => data);

// =============================================================================
// TYPES
// =============================================================================

type UserInput = z.input<typeof userSchema>;

// =============================================================================
// DEFAULT VALUES - Must be defined manually (no getSchemaDefaults helper)
// =============================================================================

const defaultValues: UserInput = {
  name: null,
  email: null,
  bio: null,
  age: null,
  address: null,
};

// =============================================================================
// COMPONENT
// =============================================================================

function WatchDemo() {
  const name = useWatch<UserInput>({ name: 'name' });
  const email = useWatch<UserInput>({ name: 'email' });
  const age = useWatch<UserInput>({ name: 'age' });

  return (
    <div className="text-xs p-2 bg-muted rounded-md space-y-1">
      <p className="font-semibold">useWatch values:</p>
      <p>name: {JSON.stringify(name)} (type: string | null | undefined)</p>
      <p>email: {JSON.stringify(email)}</p>
      <p>age: {JSON.stringify(age)}</p>
    </div>
  );
}

export default function ApproachTransformPage() {
  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues,
  });

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Transform + ctx.addIssue()</CardTitle>
          <CardDescription>
            Pure Zod approach - no external package
          </CardDescription>

          {/* Navigation */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/approach-nullable">Nullable Approach</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/create-edit">Package Approach</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Main Demo</Link>
            </Button>
          </div>

          {/* When to use */}
          <div className="mt-4 p-3 bg-blue-500/10 rounded-md text-sm space-y-2">
            <p className="font-semibold text-blue-700 dark:text-blue-400">
              When to use this approach:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>Only 1 small form in project</li>
              <li>Want zero dependencies</li>
              <li>Okay with verbose schema</li>
            </ul>
          </div>

          {/* When to use package */}
          <div className="mt-2 p-3 bg-green-500/10 rounded-md text-sm space-y-2">
            <p className="font-semibold text-green-700 dark:text-green-400">
              Use @zod-utils/react-hook-form instead when:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>Multiple forms (2+)</li>
              <li>Discriminated unions</li>
              <li>
                Want clean schemas: <code>z.string().min(1)</code>
              </li>
              <li>
                Want <code>getSchemaDefaults()</code> helper
              </li>
              <li>Better DX matters more than zero deps</li>
            </ul>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                // Clean types - no ! needed
                const name: string = data.name;
                const email: string = data.email;
                const age: number = data.age;
                const bio: string | undefined = data.bio;

                console.log('Submitted:', { name, email, age, bio });

                toast('Form submitted!', {
                  description: (
                    <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
                      <code>{JSON.stringify(data, null, 2)}</code>
                    </pre>
                  ),
                  position: 'bottom-right',
                });
              })}
              className="space-y-4"
            >
              <WatchDemo />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter name"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? null : val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? null : val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio (optional) */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter bio"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? null : val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Age */}
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter age"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? null : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <div className="space-y-3 p-3 border rounded-md">
                <p className="text-sm font-medium">Address *</p>
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter street"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? null : val);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter city"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? null : val);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Schema comparison */}
              <div className="text-xs p-3 bg-muted rounded-md space-y-2">
                <p className="font-semibold">Schema verbosity comparison:</p>
                <div className="space-y-1">
                  <p className="text-muted-foreground">This approach:</p>
                  <pre className="bg-background p-2 rounded text-[10px] overflow-x-auto">
                    {`name: z.string().nullish()
  .transform((val, ctx) => {
    if (!val) {
      ctx.addIssue({...});
      return '';
    }
    return val;
  })`}
                  </pre>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Package approach:</p>
                  <pre className="bg-background p-2 rounded text-[10px] overflow-x-auto">
                    {`name: z.string().min(1)`}
                  </pre>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset(defaultValues)}
                >
                  Reset
                </Button>
                <Button type="submit" className="flex-1">
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
