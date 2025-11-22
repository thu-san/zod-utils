'use client';

import { getSchemaDefaults, useZodForm } from '@zod-utils/react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';
import { createInputFormField, NumberFormField } from '@/components/share/form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { FormSchemaProvider } from '@/lib/form-schema-context';

const userSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('create'),
    name: z.string().min(1, 'Name is required'),
    age: z.number().optional().default(18),
  }),
  z.object({
    mode: z.literal('edit'),
    id: z.number().default(1),
    name: z.string().optional(),
    bio: z.string().optional().default('bio goes here'),
  }),
]);

type UserFormData = z.infer<typeof userSchema>;

const InputFormField = createInputFormField({
  namespace: 'user',
});

export default function CreateEditPage() {
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const form = useZodForm({
    schema: userSchema,
    defaultValues: getSchemaDefaults(userSchema, {
      discriminator: {
        field: 'mode',
        value: mode,
      },
    }),
  });

  // Update form when mode changes
  const toggleMode = () => {
    const newMode = mode === 'create' ? 'edit' : 'create';
    setMode(newMode);

    form.reset({
      mode: newMode,
      ...getSchemaDefaults(userSchema, {
        discriminator: {
          field: 'mode',
          value: newMode,
        },
      }),
    });
  };

  function onSubmit(data: UserFormData) {
    toast('Form submitted successfully!', {
      description: (
        <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: 'bottom-right',
      classNames: {
        content: 'flex flex-col gap-2',
      },
    });
  }

  return (
    <FormSchemaProvider
      schema={userSchema}
      discriminatorValue={{ discriminator: 'mode', value: mode }}
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
        <Card className="w-full sm:max-w-md">
          <CardHeader>
            <CardTitle>Discriminated Union Demo</CardTitle>
            <CardDescription>
              Using <code className="text-xs">z.discriminatedUnion()</code> for
              type-safe mode switching
            </CardDescription>
            <div className="mt-4 p-3 bg-muted rounded-md text-sm space-y-2">
              <p className="font-semibold">About this form:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  Schema uses <code>discriminatedUnion</code> with{' '}
                  <strong>mode</strong> field
                </li>
                <li>
                  Different fields appear based on <strong>create</strong> vs{' '}
                  <strong>edit</strong> mode
                </li>
                <li>TypeScript enforces correct fields per mode</li>
                <li>Form fields adjust automatically when mode changes</li>
              </ul>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    Current Mode: <strong>{mode}</strong>
                  </span>
                  <Button type="button" variant="outline" onClick={toggleMode}>
                    Switch to {mode === 'create' ? 'Edit' : 'Create'}
                  </Button>
                </div>

                {/* ID Field (only in edit mode) */}
                {mode === 'edit' && (
                  <NumberFormField
                    control={form.control}
                    name="id"
                    namespace="user"
                    placeholder="Enter ID"
                    description="Required in edit mode"
                    discriminatorField="mode"
                    discriminatorValue={mode}
                  />
                )}

                {/* Name Field */}
                <InputFormField
                  control={form.control}
                  name="name"
                  placeholder={
                    mode === 'create'
                      ? 'Enter name (required)'
                      : 'Enter name (optional)'
                  }
                  description={
                    mode === 'create'
                      ? 'Required field'
                      : 'Optional in edit mode'
                  }
                />

                {/* Age Field (only in create mode) */}
                {mode === 'create' && (
                  <NumberFormField
                    control={form.control}
                    name="age"
                    namespace="user"
                    placeholder="Enter age (optional)"
                    description="Optional in create mode"
                    discriminatorField="mode"
                    discriminatorValue={mode}
                  />
                )}

                {/* Bio Field (only in edit mode) */}
                {mode === 'edit' && (
                  <InputFormField
                    control={form.control}
                    name="bio"
                    placeholder="Enter bio (optional)"
                    description="Optional in edit mode"
                    discriminatorField="mode"
                    discriminatorValue={mode}
                  />
                )}

                {/* Info Box */}
                <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                  <p className="font-semibold mb-2">Type Information:</p>
                  {mode === 'create' ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <code>name</code> is <strong>required</strong> (string)
                      </li>
                      <li>
                        <code>age</code> is <strong>optional</strong> (number)
                      </li>
                      <li>
                        <code>id</code> and <code>bio</code> fields do not exist
                      </li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <code>id</code> is <strong>required</strong> (number)
                      </li>
                      <li>
                        <code>name</code> is <strong>optional</strong> (string |
                        undefined)
                      </li>
                      <li>
                        <code>bio</code> is <strong>optional</strong> (string |
                        undefined)
                      </li>
                      <li>
                        <code>age</code> field does not exist
                      </li>
                    </ul>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                  <Button type="submit" className="flex-1">
                    Submit {mode === 'create' ? 'Create' : 'Edit'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </FormSchemaProvider>
  );
}
