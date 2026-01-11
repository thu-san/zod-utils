'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// =============================================================================
// APPROACH: Nullable + Refine (NO transform)
//
// ❌ NOT RECOMMENDED - Output type still has null!
//
// This approach was an attempt to avoid external packages, but it has a
// fundamental flaw: the output type still includes null even though
// validation ensures values are not null at runtime.
//
// See /approach-transform for a working pure-Zod alternative.
// See /create-edit for the recommended @zod-utils/react-hook-form approach.
// =============================================================================

// Helper for required field - validates non-null but keeps null in type
function requiredString(minLength = 1, message = 'This field is required') {
  return z
    .string()
    .nullable()
    .refine((val): val is string => val !== null && val.length >= minLength, {
      message,
    });
}

function requiredNumber(message = 'This field is required') {
  return z
    .number()
    .nullable()
    .refine((val): val is number => val !== null, { message });
}

// =============================================================================
// SCHEMA - Output type STILL has null!
// =============================================================================

const createSchema = z.object({
  mode: z.literal('create'),
  name: requiredString(1, 'Name is required'),
  email: requiredString(1, 'Email is required'),
  bio: z.string().nullable(),
  age: requiredNumber('Age is required'),
  address: z.object({
    street: requiredString(1, 'Street is required'),
    city: requiredString(1, 'City is required'),
    zip: requiredString(1, 'Zip is required'),
  }),
});

const editSchema = z.object({
  mode: z.literal('edit'),
  id: requiredNumber('ID is required'),
  name: z.string().nullable(),
  email: requiredString(1, 'Email is required'),
  bio: z.string().nullable(),
});

const userSchema = z.discriminatedUnion('mode', [createSchema, editSchema]);

// =============================================================================
// TYPES - Notice: output still has null!
// =============================================================================

type UserFormData = z.infer<typeof userSchema>;
// UserFormData = {
//   mode: "create";
//   name: string | null;  <-- Still null even though validated!
//   email: string | null;
//   ...
// }

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const createDefaults: UserFormData & { mode: 'create' } = {
  mode: 'create',
  name: null,
  email: null,
  bio: null,
  age: null,
  address: {
    street: null,
    city: null,
    zip: null,
  },
};

const editDefaults: UserFormData & { mode: 'edit' } = {
  mode: 'edit',
  id: null,
  name: null,
  email: null,
  bio: null,
};

// =============================================================================
// COMPONENTS
// =============================================================================

function WatchDemo() {
  const name = useWatch<UserFormData>({ name: 'name' });
  const email = useWatch<UserFormData>({ name: 'email' });

  return (
    <div className="text-xs p-2 bg-muted rounded-md space-y-1">
      <p className="font-semibold">useWatch (typed as T | null naturally):</p>
      <p>name: {JSON.stringify(name)}</p>
      <p>email: {JSON.stringify(email)}</p>
    </div>
  );
}

export default function ApproachNullablePage() {
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: mode === 'create' ? createDefaults : editDefaults,
  });

  const toggleMode = () => {
    const newMode = mode === 'create' ? 'edit' : 'create';
    setMode(newMode);
    form.reset(newMode === 'create' ? createDefaults : editDefaults);
  };

  function onSubmit(data: UserFormData) {
    // ⚠️ PROBLEM: data.name is typed as `string | null`
    // even though validation ensures it's not null!
    if (data.mode === 'create') {
      // TypeScript thinks these could be null - need ! assertion
      // biome-ignore lint/style/noNonNullAssertion: Intentionally demonstrating the problem with this approach
      const name = data.name!;
      // biome-ignore lint/style/noNonNullAssertion: Intentionally demonstrating the problem with this approach
      const email = data.email!;
      console.log('Creating user:', name, email);
    }

    toast('Form submitted!', {
      description: (
        <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: 'bottom-right',
    });
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Nullable + Refine (Not Recommended)</CardTitle>
          <CardDescription>
            Output type still has null - requires ! assertions
          </CardDescription>

          {/* Navigation */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/approach-transform">Transform Approach</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/create-edit">Package Approach</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Main Demo</Link>
            </Button>
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 bg-destructive/10 rounded-md text-sm space-y-2">
            <p className="font-semibold text-destructive">
              Why this approach is not recommended:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>
                Output type is <code>string | null</code> even after validation
              </li>
              <li>
                Must use <code>!</code> or type guards in onSubmit
              </li>
              <li>
                Adding <code>.transform()</code> breaks zodResolver
              </li>
              <li>No type safety benefit over just using null assertions</li>
            </ul>
          </div>

          {/* Better alternatives */}
          <div className="mt-2 p-3 bg-green-500/10 rounded-md text-sm space-y-2">
            <p className="font-semibold text-green-700 dark:text-green-400">
              Better alternatives:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>
                <Link
                  href="/approach-transform"
                  className="underline hover:text-foreground"
                >
                  Transform approach
                </Link>{' '}
                - for 1 small form, zero deps
              </li>
              <li>
                <Link
                  href="/create-edit"
                  className="underline hover:text-foreground"
                >
                  @zod-utils/react-hook-form
                </Link>{' '}
                - for 2+ forms, best DX
              </li>
            </ul>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  Mode: <strong>{mode}</strong>
                </span>
                <Button type="button" variant="outline" onClick={toggleMode}>
                  Switch to {mode === 'create' ? 'Edit' : 'Create'}
                </Button>
              </div>

              <WatchDemo />

              {/* ID Field (edit only) */}
              {mode === 'edit' && (
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter ID"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? null : Number(val));
                          }}
                        />
                      </FormControl>
                      <FormDescription>Required in edit mode</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name {mode === 'create' ? '*' : '(optional)'}
                    </FormLabel>
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

              {/* Email Field */}
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

              {/* Bio Field */}
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

              {/* Age Field (create only) */}
              {mode === 'create' && (
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
              )}

              {/* Address Fields (create only) */}
              {mode === 'create' && (
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
                  <FormField
                    control={form.control}
                    name="address.zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter zip"
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
              )}

              {/* Problem demonstration */}
              <div className="text-xs p-3 bg-destructive/5 rounded-md space-y-1">
                <p className="font-semibold">The problem in onSubmit:</p>
                <pre className="bg-background p-2 rounded text-[10px] overflow-x-auto">
                  {`function onSubmit(data) {
  // data.name is string | null
  // even though validation passed!
  const name = data.name!; // Need !
}`}
                </pre>
              </div>

              {/* Submit */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.reset(
                      mode === 'create' ? createDefaults : editDefaults,
                    )
                  }
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
