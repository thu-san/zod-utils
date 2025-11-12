This is a [Next.js](https://nextjs.org) demo application showcasing [@zod-utils](https://github.com/thu-san/zod-utils) with React Hook Form integration.

## Features Demonstrated

- ✅ **Automatic type transformation** - `useZodForm` hook transforms schema types so form inputs accept `null | undefined`
- 🎯 **Auto-populated defaults** - `getSchemaDefaults()` extracts defaults from schema
- 🔍 **Auto-generated validation descriptions** - `useValidationDescription` hook shows validation constraints
- 🌐 **i18n support** - Multilingual form labels and validation messages with `next-intl`
- 📝 **Type-safe forms** - Full TypeScript integration with form fields and translations

## Validation Description Feature

The demo includes a custom `useValidationDescription` hook that automatically generates validation descriptions from Zod schema constraints:

### Supported Constraints

- `max_length` - Maximum length for strings/arrays (e.g., "Max 20")
- `length_equals` - Exact length requirement (e.g., "Length 10")
- `greater_than` - Minimum value for numbers (e.g., "Min 18")
- `less_than` - Maximum value for numbers (e.g., "Max 100")

**Note:** `min_length` is intentionally excluded as it's considered a "required" indicator shown via the asterisk (*) label, not a validation description.

### Example

```typescript
const schema = z.object({
  username: z.string().min(3).max(20),  // Shows: "Max 20"
  age: z.number().min(18).max(120),     // Shows: "Min 18, Max 120"
  tags: z.array(z.string()).max(5),     // Shows: "Max 5"
});
```

The descriptions are automatically:
- **Extracted** from schema using `getFieldChecks()` from `@zod-utils/core`
- **Translated** using i18n keys in `lang/en/user.json`
- **Displayed** below form fields via form components

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
