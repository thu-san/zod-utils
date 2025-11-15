import { zodResolver } from '@hookform/resolvers/zod';
import {
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  useForm,
} from 'react-hook-form';
import type { z } from 'zod';
import type {
  PartialWithAllNullables,
  PartialWithNullableObjects,
} from './types';

/**
 * Type-safe React Hook Form wrapper with automatic Zod v4 schema validation and type transformation.
 *
 * This hook eliminates the TypeScript friction between React Hook Form's nullable field values
 * and Zod's strict output types. It uses a two-type schema pattern where:
 * - **Input type** (`PartialWithNullableObjects<TOutput>`): Form fields accept `null | undefined` during editing
 * - **Output type** (`TOutput`): Validated data matches exact schema type (no `null | undefined`)
 *
 * **Key Benefits:**
 * - ✅ No more "Type 'null' is not assignable to..." TypeScript errors
 * - ✅ Use `form.setValue()` and `form.reset()` with `null` values freely
 * - ✅ Validated output is still type-safe with exact Zod schema types
 * - ✅ Automatic zodResolver setup - no manual configuration needed
 *
 * @template TOutput - The Zod schema output type (extends FieldValues)
 * @template TInput - The Zod schema input type (accepts nullable/undefined values during form editing)
 *
 * @param options - Configuration object
 * @param options.schema - Zod schema with two-type signature `z.ZodType<TOutput, TInput>`
 * @param options.defaultValues - Default form values (accepts nullable/undefined values)
 * @param options.zodResolverOptions - Optional zodResolver configuration
 * @param options....formOptions - All other react-hook-form useForm options
 *
 * @returns React Hook Form instance with type-safe methods
 *
 * @example
 * Basic usage with required fields
 * ```typescript
 * import { useZodForm } from '@zod-utils/react-hook-form';
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   name: z.string().min(1), // Required field
 *   age: z.number().min(0),
 * }) satisfies z.ZodType<{ name: string; age: number }, any>;
 *
 * function MyForm() {
 *   const form = useZodForm({ schema });
 *
 *   // ✅ These work without type errors:
 *   form.setValue('name', null); // Accepts null during editing
 *   form.reset({ name: null, age: null }); // Reset with null
 *
 *   const onSubmit = (data: { name: string; age: number }) => {
 *     // ✅ data is exact type - no null | undefined
 *     console.log(data.name.toUpperCase()); // Safe to use string methods
 *   };
 *
 *   return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
 * }
 * ```
 *
 * @example
 * With default values
 * ```typescript
 * const schema = z.object({
 *   username: z.string(),
 *   email: z.string().email(),
 *   notifications: z.boolean().default(true),
 * }) satisfies z.ZodType<{
 *   username: string;
 *   email: string;
 *   notifications: boolean;
 * }, any>;
 *
 * const form = useZodForm({
 *   schema,
 *   defaultValues: {
 *     username: '',
 *     email: '',
 *     // notifications gets default from schema
 *   },
 * });
 * ```
 *
 * @example
 * Without default values (all fields are optional during editing)
 * ```typescript
 * const schema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number(),
 * }) satisfies z.ZodType<{ name: string; email: string; age: number }, any>;
 *
 * // ✅ No defaultValues needed - fields are optional during editing
 * const form = useZodForm({ schema });
 *
 * // Form fields can be set individually as user types
 * form.setValue('name', 'John');
 * form.setValue('email', 'john@example.com');
 * form.setValue('age', 25);
 *
 * // All fields must be valid on submit (per schema validation)
 * ```
 *
 * @example
 * With optional and nullable fields
 * ```typescript
 * const schema = z.object({
 *   title: z.string(),
 *   description: z.string().optional(), // Optional in output
 *   tags: z.array(z.string()).nullable(), // Nullable in output
 * }) satisfies z.ZodType<{
 *   title: string;
 *   description?: string;
 *   tags: string[] | null;
 * }, any>;
 *
 * const form = useZodForm({ schema });
 *
 * // All fields accept null/undefined during editing
 * form.setValue('title', null);
 * form.setValue('description', undefined);
 * form.setValue('tags', null);
 * ```
 *
 * @example
 * With zodResolver options
 * ```typescript
 * const form = useZodForm({
 *   schema,
 *   zodResolverOptions: {
 *     async: true, // Enable async validation
 *     errorMap: customErrorMap, // Custom error messages
 *   },
 * });
 * ```
 *
 * @example
 * Complete form example
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email'),
 *   age: z.number().min(18, 'Must be 18+'),
 * }) satisfies z.ZodType<{ name: string; email: string; age: number }, any>;
 *
 * function UserForm() {
 *   const form = useZodForm({
 *     schema: userSchema,
 *     defaultValues: { name: '', email: '', age: null },
 *   });
 *
 *   const onSubmit = (data: { name: string; email: string; age: number }) => {
 *     // Type-safe: data has exact types, no null/undefined
 *     console.log(`${data.name} is ${data.age} years old`);
 *   };
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register('name')} />
 *       <input {...form.register('email')} type="email" />
 *       <input {...form.register('age', { valueAsNumber: true })} type="number" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @see {@link PartialWithNullableObjects} for the type transformation utility
 * @see https://react-hook-form.com/docs/useform for React Hook Form documentation
 * @see https://zod.dev for Zod schema documentation
 * @since 0.1.0
 */
export const useZodForm = <
  TOutput extends FieldValues,
  TFormInput extends
    PartialWithAllNullables<TOutput> = PartialWithNullableObjects<TOutput>,
  TInput extends TFormInput = TFormInput,
>({
  schema,
  zodResolverOptions,
  ...formOptions
}: {
  schema: z.ZodType<TOutput, TInput>;
  defaultValues?: DefaultValues<TFormInput>;
  zodResolverOptions?: Parameters<typeof zodResolver>[1];
} & Omit<
  UseFormProps<TFormInput, unknown, TOutput>,
  'resolver' | 'defaultValues'
>) => {
  const resolver = zodResolver<TFormInput, unknown, TOutput>(
    schema,
    zodResolverOptions,
  );

  return useForm({
    resolver,
    ...formOptions,
  });
};
