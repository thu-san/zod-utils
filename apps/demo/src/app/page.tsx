'use client';

import {
  FormSchemaProvider,
  getSchemaDefaults,
  useZodForm,
} from '@zod-utils/react-hook-form';
import { useTranslations } from 'next-intl';
import { type CSSProperties, useId } from 'react';
import { toast } from 'sonner';
import z from 'zod';
import {
  createCheckboxFormField,
  createInputFormField,
  createNumberFormField,
  TFormLabel,
} from '@/components/share/form';
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
import { formErrorHandler } from '@/lib/error-map';

const formSchema = z.object({
  // String fields
  stringRequired: z
    .string()
    .nonempty()
    .max(100)
    .meta({ translationKey: 'user.field.stringRequired' }),
  stringOptional: z
    .string()
    .optional()
    .meta({ translationKey: 'user.field.stringOptional' }),
  stringRequiredWithDefault: z
    .string()
    .min(3)
    .default('Default String')
    .meta({ translationKey: 'user.field.stringRequiredWithDefault' }),
  stringOptionalWithDefault: z
    .string()
    .optional()
    .default('Optional Default')
    .meta({ translationKey: 'user.field.stringOptionalWithDefault' }),
  stringNullish: z
    .string()
    .nullable()
    .meta({ translationKey: 'user.field.stringNullish' }),
  stringNullishWithDefault: z
    .string()
    .nullable()
    .default('Nullable Default')
    .meta({ translationKey: 'user.field.stringNullishWithDefault' }),

  // Number fields
  // NOTE: *OptionalWithDefault fields can't be cleared (reverts to default).
  // Use *NullishWithDefault instead and set null to clear.
  numberRequired: z
    .number()
    .meta({ translationKey: 'user.field.numberRequired' }),
  numberOptional: z
    .number()
    .optional()
    .meta({ translationKey: 'user.field.numberOptional' }),
  numberRequiredWithDefault: z
    .number()
    .default(42)
    .meta({ translationKey: 'user.field.numberRequiredWithDefault' }),
  numberOptionalWithDefault: z
    .number()
    .optional()
    .default(100)
    .meta({ translationKey: 'user.field.numberOptionalWithDefault' }),
  numberNullish: z
    .number()
    .nullable()
    .meta({ translationKey: 'user.field.numberNullish' }),
  numberNullishWithDefault: z
    .number()
    .nullable()
    .default(200)
    .meta({ translationKey: 'user.field.numberNullishWithDefault' }),

  // Boolean fields
  booleanRequired: z
    .boolean()
    .meta({ translationKey: 'user.field.booleanRequired' }),
  booleanOptional: z
    .boolean()
    .optional()
    .meta({ translationKey: 'user.field.booleanOptional' }),
  booleanRequiredWithDefault: z
    .boolean()
    .default(true)
    .meta({ translationKey: 'user.field.booleanRequiredWithDefault' }),
  booleanOptionalWithDefault: z
    .boolean()
    .optional()
    .default(false)
    .meta({ translationKey: 'user.field.booleanOptionalWithDefault' }),
  booleanNullish: z
    .boolean()
    .nullable()
    .meta({ translationKey: 'user.field.booleanNullish' }),
  booleanNullishWithDefault: z
    .boolean()
    .nullable()
    .default(true)
    .meta({ translationKey: 'user.field.booleanNullishWithDefault' }),

  // Array of String fields
  arrayOfStringRequired: z
    .array(z.string())
    .nonempty()
    .meta({ translationKey: 'user.field.arrayOfStringRequired' }),
  arrayOfStringOptional: z
    .array(z.string())
    .optional()
    .meta({ translationKey: 'user.field.arrayOfStringOptional' }),
  arrayOfStringRequiredWithDefault: z
    .array(z.string())
    .nonempty()
    .default(['tag1', 'tag2'])
    .meta({ translationKey: 'user.field.arrayOfStringRequiredWithDefault' }),
  arrayOfStringOptionalWithDefault: z
    .array(z.string())
    .optional()
    .default(['optional1'])
    .meta({ translationKey: 'user.field.arrayOfStringOptionalWithDefault' }),
  arrayOfStringNullish: z
    .array(z.string())
    .nullable()
    .meta({ translationKey: 'user.field.arrayOfStringNullish' }),
  arrayOfStringNullishWithDefault: z
    .array(z.string())
    .nullable()
    .default(['nullable1'])
    .meta({ translationKey: 'user.field.arrayOfStringNullishWithDefault' }),
  // Array of Objects fields
  arrayOfObjectsRequired: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .nonempty(),
  arrayOfObjectsOptional: z
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
  arrayOfObjectsOptionalWithDefault: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .optional()
    .default([{ name: 'optional', value: 'optValue' }]),
  arrayOfObjectsNullish: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .nullable(),
  arrayOfObjectsNullishWithDefault: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .nullable()
    .default([{ name: 'nullable', value: 'nullValue' }]),

  // Object fields
  objectRequired: z.object({
    street: z.string(),
    city: z.string(),
  }),
  objectOptional: z
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
  objectOptionalWithDefault: z
    .object({
      notifications: z.boolean(),
      frequency: z.string(),
    })
    .optional()
    .default({ notifications: true, frequency: 'daily' }),
  objectNullish: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .nullable(),
  objectNullishWithDefault: z
    .object({
      alerts: z.boolean(),
      interval: z.string(),
    })
    .nullable()
    .default({ alerts: false, interval: 'weekly' }),
});

const UserInputFormField = createInputFormField({
  schema: formSchema,
});
const UserNumberFormField = createNumberFormField({
  schema: formSchema,
});
const UserCheckboxFormField = createCheckboxFormField({
  schema: formSchema,
});

export default function UserProfileForm() {
  const formId = useId();
  const t = useTranslations('user');

  const form = useZodForm({
    schema: formSchema,
    defaultValues: getSchemaDefaults({ schema: formSchema }),
    zodResolverOptions: {
      error: formErrorHandler,
    },
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
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4 pb-24">
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
                      <UserInputFormField
                        name="stringRequired"
                        autoPlaceholder
                      />
                      <UserInputFormField
                        name="stringOptional"
                        autoPlaceholder
                      />
                      <UserInputFormField
                        name="stringRequiredWithDefault"
                        autoPlaceholder
                        description='Min 3, Default: "Default String"'
                      />
                      <UserInputFormField
                        name="stringOptionalWithDefault"
                        autoPlaceholder
                        description='Default: "Optional Default"'
                      />
                      <UserInputFormField
                        name="stringNullish"
                        autoPlaceholder
                      />
                      <UserInputFormField
                        name="stringNullishWithDefault"
                        autoPlaceholder
                        description='Nullable, Default: "Nullable Default" (can clear with null)'
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
                      <UserNumberFormField
                        name="numberRequired"
                        autoPlaceholder
                      />
                      <UserNumberFormField
                        name="numberOptional"
                        autoPlaceholder
                      />
                      <UserNumberFormField
                        name="numberRequiredWithDefault"
                        autoPlaceholder
                        description="Default: 42"
                      />
                      <UserNumberFormField
                        name="numberOptionalWithDefault"
                        autoPlaceholder
                        description="Optional with default: 100 (will error if cleared with null)"
                      />
                      <UserNumberFormField
                        name="numberNullish"
                        autoPlaceholder
                      />
                      <UserNumberFormField
                        name="numberNullishWithDefault"
                        autoPlaceholder
                        description="Nullable with default: 200 (can clear with null)"
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
                      <UserCheckboxFormField name="booleanRequired" />
                      <UserCheckboxFormField name="booleanOptional" />
                      <UserCheckboxFormField
                        name="booleanRequiredWithDefault"
                        description="Default: true"
                      />
                      <UserCheckboxFormField
                        name="booleanOptionalWithDefault"
                        description="Optional with default: false"
                      />
                      <UserCheckboxFormField name="booleanNullish" />
                      <UserCheckboxFormField
                        name="booleanNullishWithDefault"
                        description="Nullable with default: true"
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
                        name="arrayOfStringRequired"
                        render={({ field }) => (
                          <FormItem>
                            <TFormLabel
                              schema={formSchema}
                              name="arrayOfStringRequired"
                            />
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
                                placeholder={t(
                                  'placeholders.arrayOfStringRequired',
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="arrayOfStringOptional"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('field.arrayOfStringOptional')}
                            </FormLabel>
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
                                placeholder={t(
                                  'placeholders.arrayOfStringOptional',
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="arrayOfStringRequiredWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <TFormLabel
                              schema={formSchema}
                              name="arrayOfStringRequiredWithDefault"
                            />
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
                                placeholder={t(
                                  'placeholders.arrayOfStringRequiredWithDefault',
                                )}
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
                        name="arrayOfStringOptionalWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('field.arrayOfStringOptionalWithDefault')}
                            </FormLabel>
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
                                placeholder={t(
                                  'placeholders.arrayOfStringOptionalWithDefault',
                                )}
                              />
                            </FormControl>
                            <FormDescription>
                              Default: ["optional1"] (CAN'T clear - reverts to
                              default)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="arrayOfStringNullish"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('field.arrayOfStringNullish')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                value={
                                  Array.isArray(field.value)
                                    ? field.value.join(', ')
                                    : ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(
                                    val
                                      ? val
                                          .split(',')
                                          .map((s) => s.trim())
                                          .filter(Boolean)
                                      : null,
                                  );
                                }}
                                onBlur={field.onBlur}
                                placeholder={t(
                                  'placeholders.arrayOfStringNullish',
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="arrayOfStringNullishWithDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('field.arrayOfStringNullishWithDefault')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                value={
                                  Array.isArray(field.value)
                                    ? field.value.join(', ')
                                    : ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  field.onChange(
                                    val
                                      ? val
                                          .split(',')
                                          .map((s) => s.trim())
                                          .filter(Boolean)
                                      : null,
                                  );
                                }}
                                onBlur={field.onBlur}
                                placeholder={t(
                                  'placeholders.arrayOfStringNullishWithDefault',
                                )}
                              />
                            </FormControl>
                            <FormDescription>
                              Default: ["nullable1"] (CAN clear with null)
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
