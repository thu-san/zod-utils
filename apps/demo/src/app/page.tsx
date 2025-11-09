'use client';

import { getSchemaDefaults, useZodForm } from '@zod-utils/react-hook-form';
import { type CSSProperties, useId } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { FormSchemaProvider } from '@/lib/form-schema-context';

const formSchema = z.object({
  // String fields
  stringRequired: z.string().nonempty(),
  stringNullish: z.string().optional(),
  stringRequiredWithDefault: z.string().min(3).default('Default String'),
  stringNullishWithDefault: z.string().optional().default('Optional Default'),

  // Number fields
  numberRequired: z.number(),
  numberNullish: z.number().optional(),
  numberRequiredWithDefault: z.number().default(42),
  numberNullishWithDefault: z.number().optional().default(100),

  // Boolean fields
  booleanRequired: z.boolean(),
  booleanNullish: z.boolean().optional(),
  booleanRequiredWithDefault: z.boolean().default(true),
  booleanNullishWithDefault: z.boolean().optional().default(false),

  // Array of String fields
  arrayOfStringRequired: z.array(z.string()).nonempty(),
  arrayOfStringNullish: z.array(z.string()).optional(),
  arrayOfStringRequiredWithDefault: z
    .array(z.string())
    .nonempty()
    .default(['tag1', 'tag2']),
  arrayOfStringNullishWithDefault: z
    .array(z.string())
    .optional()
    .default(['optional1']),

  // Array of Objects fields
  arrayOfObjectsRequired: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .nonempty(),
  arrayOfObjectsNullish: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  arrayOfObjectsRequiredWithDefault: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .nonempty()
    .default([{ name: 'item1', value: 'value1' }]),
  arrayOfObjectsNullishWithDefault: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .optional()
    .default([{ name: 'optional', value: 'optValue' }]),

  // Object fields
  objectRequired: z.object({
    street: z.string(),
    city: z.string(),
  }),
  objectNullish: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
  objectRequiredWithDefault: z
    .object({
      theme: z.string(),
      language: z.string(),
    })
    .default({ theme: 'light', language: 'en' }),
  objectNullishWithDefault: z
    .object({
      notifications: z.boolean(),
      frequency: z.string(),
    })
    .optional()
    .default({ notifications: true, frequency: 'daily' }),
});

export default function UserProfileForm() {
  const formId = useId();

  const form = useZodForm({
    schema: formSchema,
    defaultValues: getSchemaDefaults(formSchema),
  });

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
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      style: {
        '--border-radius': 'calc(var(--radius)  + 4px)',
      } as CSSProperties,
    });
  }

  return (
    <FormSchemaProvider schema={formSchema}>
      <Form {...form}>
        <div className="flex items-center justify-center min-h-screen p-4 pb-24">
          <Card className="w-full sm:max-w-md">
            <CardHeader>
              <CardTitle>Field Type Demo</CardTitle>
              <CardDescription>
                Demonstrating all field types with their variations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  {/* STRING FIELDS */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      String Fields
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="stringRequired"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stringNullish"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nullish (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stringRequiredWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required with Default</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormDescription>
                              Default: "Default String"
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stringNullishWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nullish with Default</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormDescription>
                              Default: "Optional Default"
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* NUMBER FIELDS */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      Number Fields
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="numberRequired"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="numberNullish"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nullish (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(
                                    val === '' ? undefined : Number(val),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="numberRequiredWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required with Default</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                            <FormDescription>Default: 42</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="numberNullishWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nullish with Default</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(
                                    val === '' ? undefined : Number(val),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormDescription>Default: 100</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* BOOLEAN FIELDS */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      Boolean Fields
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="booleanRequired"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <input
                                  {...field}
                                  type="checkbox"
                                  checked={field.value ?? false}
                                  value={undefined}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Required</FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="booleanNullish"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <input
                                  {...field}
                                  type="checkbox"
                                  checked={field.value ?? false}
                                  value={undefined}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">
                                Nullish (Optional)
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="booleanRequiredWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <input
                                  {...field}
                                  type="checkbox"
                                  checked={field.value ?? false}
                                  value={undefined}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">
                                Required with Default
                              </FormLabel>
                            </div>
                            <FormDescription>Default: true</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="booleanNullishWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <input
                                  {...field}
                                  type="checkbox"
                                  checked={field.value ?? false}
                                  value={undefined}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">
                                Nullish with Default
                              </FormLabel>
                            </div>
                            <FormDescription>Default: false</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* ARRAY OF STRING FIELDS */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      Array of String Fields
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="arrayOfStringRequired"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required</FormLabel>
                            <FormControl>
                              <Input
                                value={
                                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                                  (field.value as string[] | undefined)?.join(
                                    ', ',
                                  ) || ''
                                }
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  )
                                }
                                onBlur={field.onBlur}
                                placeholder="Comma-separated"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="arrayOfStringNullish"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nullish (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                value={
                                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                                  (field.value as string[] | undefined)?.join(
                                    ', ',
                                  ) || ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(
                                    val
                                      ? val
                                          .split(',')
                                          .map((s) => s.trim())
                                          .filter(Boolean)
                                      : undefined,
                                  );
                                }}
                                onBlur={field.onBlur}
                                placeholder="Comma-separated"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="arrayOfStringRequiredWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required with Default</FormLabel>
                            <FormControl>
                              <Input
                                value={
                                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                                  (field.value as string[] | undefined)?.join(
                                    ', ',
                                  ) || ''
                                }
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  )
                                }
                                onBlur={field.onBlur}
                                placeholder="Comma-separated"
                              />
                            </FormControl>
                            <FormDescription>
                              Default: ["tag1", "tag2"]
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="arrayOfStringNullishWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nullish with Default</FormLabel>
                            <FormControl>
                              <Input
                                value={
                                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                                  (field.value as string[] | undefined)?.join(
                                    ', ',
                                  ) || ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(
                                    val
                                      ? val
                                          .split(',')
                                          .map((s) => s.trim())
                                          .filter(Boolean)
                                      : undefined,
                                  );
                                }}
                                onBlur={field.onBlur}
                                placeholder="Comma-separated"
                              />
                            </FormControl>
                            <FormDescription>
                              Default: ["optional1"]
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Note about complex fields */}
                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                    <p>
                      <strong>Note:</strong> Array of Objects and Object fields
                      are also supported but require custom UI components for
                      proper editing. The defaults are being populated correctly
                      via <code>getSchemaDefaults()</code>.
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button type="submit" form={formId}>
              Submit
            </Button>
          </div>
        </div>
      </Form>
    </FormSchemaProvider>
  );
}
