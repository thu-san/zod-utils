'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type CSSProperties, useId } from 'react';
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

const _name = z.string().nonempty().default('');

const _arr = z.array(z.string()).nonempty();

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

const _checkIfFieldIsRequired = <T extends z.ZodTypeAny>(field: T) => {
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

function _getSchemaDefaults<T extends z.ZodObject<any>>(
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
      const nestedDefaults = _getSchemaDefaults(unwrapped);
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

export default function BugReportForm() {
  const formId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const emailId = useId();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      age: 1,
      description: '',
      email: '',
    },
  });

  const clearField = () => {
    // Clear field logic would go here
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
      } as CSSProperties,
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
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={titleId} fieldName="title">
                      Bug Title
                    </FieldLabel>
                    <Input
                      {...field}
                      id={titleId}
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
                    <FieldLabel htmlFor={descriptionId} fieldName="description">
                      Description
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        {...field}
                        id={descriptionId}
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
                    <FieldLabel htmlFor={emailId} fieldName="email">
                      Contact Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id={emailId}
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
