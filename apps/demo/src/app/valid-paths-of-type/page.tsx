'use client';

import type { ValidPaths } from '@zod-utils/core';
import { useState } from 'react';
import z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Demo schema with various field types and nesting levels
const demoSchema = z.object({
  // First level - primitives
  name: z.string(),
  email: z.email(),
  age: z.number(),
  isActive: z.boolean(),

  // First level - nested object
  profile: z.object({
    bio: z.string(),
    website: z.url().optional(),
    followers: z.number(),
    verified: z.boolean(),
  }),

  // First level - array of objects
  addresses: z.array(
    z.object({
      street: z.string(),
      city: z.string(),
      zipCode: z.string(),
      isPrimary: z.boolean(),
    }),
  ),

  // Deeply nested
  settings: z.object({
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      frequency: z.string(),
    }),
    preferences: z.object({
      theme: z.string(),
      language: z.string(),
    }),
  }),
});

// Type-level path extraction - these are compile-time types!
type StringPaths = ValidPaths<
  typeof demoSchema,
  never,
  never,
  string | undefined
>;
type NumberPaths = ValidPaths<typeof demoSchema, never, never, number>;
type BooleanPaths = ValidPaths<typeof demoSchema, never, never, boolean>;

// Object types for object path extraction
type Profile = z.infer<typeof demoSchema>['profile'];
type Address = z.infer<typeof demoSchema>['addresses'][number];
type Notifications = z.infer<typeof demoSchema>['settings']['notifications'];
type ProfilePaths = ValidPaths<typeof demoSchema, never, never, Profile>;
type AddressPaths = ValidPaths<typeof demoSchema, never, never, Address>;
type NotificationsPaths = ValidPaths<
  typeof demoSchema,
  never,
  never,
  Notifications
>;

// ==========================================
// DISCRIMINATED UNION SCHEMA
// ==========================================
const discriminatedSchema = z.discriminatedUnion('type', [
  // Personal variant - has personal-specific nested structures
  z.object({
    type: z.literal('personal'),
    // Primitives
    firstName: z.string(),
    lastName: z.string(),
    age: z.number(),
    isStudent: z.boolean(),
    // Nested object (personal-specific)
    emergencyContact: z.object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    }),
    // Array of objects (personal-specific)
    education: z.array(
      z.object({
        school: z.string(),
        degree: z.string(),
        graduationYear: z.number(),
      }),
    ),
    // Deeply nested (personal-specific)
    preferences: z.object({
      notifications: z.object({
        email: z.boolean(),
        sms: z.boolean(),
      }),
    }),
  }),
  // Business variant - has business-specific nested structures
  z.object({
    type: z.literal('business'),
    // Primitives
    companyName: z.string(),
    taxId: z.string(),
    employeeCount: z.number(),
    isPublic: z.boolean(),
    // Nested object (business-specific)
    headquarters: z.object({
      address: z.string(),
      city: z.string(),
      country: z.string(),
    }),
    // Array of objects (business-specific)
    departments: z.array(
      z.object({
        name: z.string(),
        headCount: z.number(),
        budget: z.number(),
      }),
    ),
    // Deeply nested (business-specific)
    compliance: z.object({
      certifications: z.object({
        iso9001: z.boolean(),
        iso27001: z.boolean(),
      }),
    }),
  }),
]);

// ==========================================
// PERSONAL VARIANT TYPES
// ==========================================
type PersonalEmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};
type PersonalEducation = {
  school: string;
  degree: string;
  graduationYear: number;
};
type PersonalNotifications = { email: boolean; sms: boolean };

type PersonalStringPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'personal',
  string
>;
type PersonalNumberPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'personal',
  number
>;
type PersonalBooleanPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'personal',
  boolean
>;
type PersonalEmergencyContactPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'personal',
  PersonalEmergencyContact
>;
type PersonalEducationPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'personal',
  PersonalEducation
>;
type PersonalNotificationsPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'personal',
  PersonalNotifications
>;

// ==========================================
// BUSINESS VARIANT TYPES
// ==========================================
type BusinessHeadquarters = { address: string; city: string; country: string };
type BusinessDepartment = { name: string; headCount: number; budget: number };
type BusinessCertifications = { iso9001: boolean; iso27001: boolean };

type BusinessStringPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'business',
  string
>;
type BusinessNumberPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'business',
  number
>;
type BusinessBooleanPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'business',
  boolean
>;
type BusinessHeadquartersPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'business',
  BusinessHeadquarters
>;
type BusinessDepartmentPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'business',
  BusinessDepartment
>;
type BusinessCertificationsPaths = ValidPaths<
  typeof discriminatedSchema,
  'type',
  'business',
  BusinessCertifications
>;

// Helper arrays for display
const personalStringPaths: PersonalStringPaths[] = [
  'type',
  'firstName',
  'lastName',
  'emergencyContact.name',
  'emergencyContact.phone',
  'emergencyContact.relationship',
  'education.0.school',
  'education.0.degree',
];
const personalNumberPaths: PersonalNumberPaths[] = [
  'age',
  'education.0.graduationYear',
];
const personalBooleanPaths: PersonalBooleanPaths[] = [
  'isStudent',
  'preferences.notifications.email',
  'preferences.notifications.sms',
];

const businessStringPaths: BusinessStringPaths[] = [
  'type',
  'companyName',
  'taxId',
  'headquarters.address',
  'headquarters.city',
  'headquarters.country',
  'departments.0.name',
];
const businessNumberPaths: BusinessNumberPaths[] = [
  'employeeCount',
  'departments.0.headCount',
  'departments.0.budget',
];
const businessBooleanPaths: BusinessBooleanPaths[] = [
  'isPublic',
  'compliance.certifications.iso9001',
  'compliance.certifications.iso27001',
];

// ==========================================
// TYPE-SAFE COMPONENTS FOR PERSONAL VARIANT
// ==========================================
function PersonalStringInput<TPath extends PersonalStringPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-950 rounded">
      <span className="text-xs text-indigo-600 dark:text-indigo-400">
        PersonalString:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function PersonalNumberInput<TPath extends PersonalNumberPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-950 rounded">
      <span className="text-xs text-indigo-600 dark:text-indigo-400">
        PersonalNumber:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function PersonalBooleanInput<TPath extends PersonalBooleanPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-950 rounded">
      <span className="text-xs text-indigo-600 dark:text-indigo-400">
        PersonalBoolean:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function PersonalEmergencyContactSection<
  TPath extends PersonalEmergencyContactPaths,
>({ name }: { name: TPath }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-violet-50 dark:bg-violet-950 rounded">
      <span className="text-xs text-violet-600 dark:text-violet-400">
        EmergencyContactSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function PersonalEducationSection<TPath extends PersonalEducationPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-violet-50 dark:bg-violet-950 rounded">
      <span className="text-xs text-violet-600 dark:text-violet-400">
        EducationSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function PersonalNotificationsSection<
  TPath extends PersonalNotificationsPaths,
>({ name }: { name: TPath }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-violet-50 dark:bg-violet-950 rounded">
      <span className="text-xs text-violet-600 dark:text-violet-400">
        NotificationsSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

// ==========================================
// TYPE-SAFE COMPONENTS FOR BUSINESS VARIANT
// ==========================================
function BusinessStringInput<TPath extends BusinessStringPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 rounded">
      <span className="text-xs text-amber-600 dark:text-amber-400">
        BusinessString:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function BusinessNumberInput<TPath extends BusinessNumberPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 rounded">
      <span className="text-xs text-amber-600 dark:text-amber-400">
        BusinessNumber:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function BusinessBooleanInput<TPath extends BusinessBooleanPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 rounded">
      <span className="text-xs text-amber-600 dark:text-amber-400">
        BusinessBoolean:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function BusinessHeadquartersSection<TPath extends BusinessHeadquartersPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded">
      <span className="text-xs text-orange-600 dark:text-orange-400">
        HeadquartersSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function BusinessDepartmentSection<TPath extends BusinessDepartmentPaths>({
  name,
}: {
  name: TPath;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded">
      <span className="text-xs text-orange-600 dark:text-orange-400">
        DepartmentSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function BusinessCertificationsSection<
  TPath extends BusinessCertificationsPaths,
>({ name }: { name: TPath }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded">
      <span className="text-xs text-orange-600 dark:text-orange-400">
        CertificationsSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

// Helper to display paths as an array (for demo purposes)
const stringPaths: StringPaths[] = [
  // First level
  'name',
  'email',
  // Nested object
  'profile.bio',
  'profile.website',
  // Array of objects (with .0 index)
  'addresses.0.street',
  'addresses.0.city',
  'addresses.0.zipCode',
  // Deeply nested
  'settings.notifications.frequency',
  'settings.preferences.theme',
  'settings.preferences.language',
];

const numberPaths: NumberPaths[] = [
  // First level
  'age',
  // Nested object
  'profile.followers',
];

const booleanPaths: BooleanPaths[] = [
  // First level
  'isActive',
  // Nested object
  'profile.verified',
  // Array of objects
  'addresses.0.isPrimary',
  // Deeply nested
  'settings.notifications.email',
  'settings.notifications.sms',
];

// Object paths - paths that resolve to object types
const profilePaths: ProfilePaths[] = ['profile'];
const addressPaths: AddressPaths[] = ['addresses.0'];
const notificationsPaths: NotificationsPaths[] = ['settings.notifications'];

// ==========================================
// ACTUAL USAGE: Type-safe components with schema and name props
// Try hovering over the `name` prop in VS Code to see IntelliSense!
// ==========================================

/**
 * A type-safe string input component.
 * The `name` prop only accepts paths that resolve to string values.
 */
function StringInput<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, string>,
>({ schema, name }: { schema: TSchema; name: TPath }) {
  // In real usage, you'd use useFormContext() here
  void schema; // schema used for type inference only
  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
      <span className="text-xs text-blue-600 dark:text-blue-400">
        StringInput:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

/**
 * A type-safe number input component.
 * The `name` prop only accepts paths that resolve to number values.
 */
function NumberInput<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, number>,
>({ schema, name }: { schema: TSchema; name: TPath }) {
  void schema;
  return (
    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
      <span className="text-xs text-green-600 dark:text-green-400">
        NumberInput:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

/**
 * A type-safe boolean/checkbox input component.
 * The `name` prop only accepts paths that resolve to boolean values.
 */
function BooleanInput<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, boolean>,
>({ schema, name }: { schema: TSchema; name: TPath }) {
  void schema;
  return (
    <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950 rounded">
      <span className="text-xs text-purple-600 dark:text-purple-400">
        BooleanInput:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

/**
 * Type-safe section components for object types.
 * TPath is auto-inferred from the `name` prop - no manual type params needed!
 */
function ProfileSection<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, Profile>,
>({ schema, name }: { schema: TSchema; name: TPath }) {
  void schema;
  return (
    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded">
      <span className="text-xs text-orange-600 dark:text-orange-400">
        ProfileSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function AddressSection<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, Address>,
>({ schema, name }: { schema: TSchema; name: TPath }) {
  void schema;
  return (
    <div className="flex items-center gap-2 p-2 bg-pink-50 dark:bg-pink-950 rounded">
      <span className="text-xs text-pink-600 dark:text-pink-400">
        AddressSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function NotificationsSection<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, Notifications>,
>({ schema, name }: { schema: TSchema; name: TPath }) {
  void schema;
  return (
    <div className="flex items-center gap-2 p-2 bg-cyan-50 dark:bg-cyan-950 rounded">
      <span className="text-xs text-cyan-600 dark:text-cyan-400">
        NotificationsSection:
      </span>
      <code className="text-sm font-mono">{name}</code>
    </div>
  );
}

function PathBadge({ path, color }: { path: string; color: string }) {
  return (
    <code
      className={`px-2 py-1 rounded text-sm font-mono ${color} inline-block`}
    >
      {path}
    </code>
  );
}

function PathSection({
  title,
  description,
  paths,
  color,
  typeDefinition,
}: {
  title: string;
  description: string;
  paths: string[];
  color: string;
  typeDefinition: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="bg-muted p-3 rounded-md">
        <code className="text-xs text-muted-foreground">{typeDefinition}</code>
      </div>
      <div className="flex flex-wrap gap-2">
        {paths.map((path) => (
          <PathBadge key={path} path={path} color={color} />
        ))}
      </div>
    </div>
  );
}

export default function ValidPathsPage() {
  const [activeTab, setActiveTab] = useState<'basic' | 'discriminated'>(
    'basic',
  );

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>ValidPaths Demo</CardTitle>
          <CardDescription>
            Filter field paths by value type - including nested objects and
            arrays
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tab Toggle */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'basic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('basic')}
            >
              Basic Schema
            </Button>
            <Button
              variant={activeTab === 'discriminated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('discriminated')}
            >
              Discriminated Union
            </Button>
          </div>

          <Separator />

          {activeTab === 'basic' ? (
            <BasicSchemaContent />
          ) : (
            <DiscriminatedSchemaContent />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BasicSchemaContent() {
  return (
    <div className="space-y-6">
      {/* Schema Display */}
      <div>
        <h3 className="font-semibold text-sm mb-2">Schema Structure</h3>
        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
          {`const schema = z.object({
  // First level - primitives
  name: z.string(),
  email: z.string().email(),
  age: z.number(),
  isActive: z.boolean(),

  // Nested object
  profile: z.object({
    bio: z.string(),
    website: z.string().url().optional(),
    followers: z.number(),
    verified: z.boolean(),
  }),

  // Array of objects
  addresses: z.array(z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string(),
    isPrimary: z.boolean(),
  })),

  // Deeply nested
  settings: z.object({
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      frequency: z.string(),
    }),
    preferences: z.object({
      theme: z.string(),
      language: z.string(),
    }),
  }),
});`}
        </pre>
      </div>

      <Separator />

      {/* Interactive Demo - Actual Components */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">Interactive Demo</h3>
          <p className="text-sm text-muted-foreground">
            These are actual components using ValidPaths. Hover over the{' '}
            <code>name</code> prop in your IDE to see IntelliSense!
          </p>
        </div>

        <div className="grid gap-2">
          {/* String inputs - only accepts string paths */}
          <StringInput schema={demoSchema} name="name" />
          <StringInput schema={demoSchema} name="email" />
          <StringInput schema={demoSchema} name="profile.bio" />
          <StringInput schema={demoSchema} name="settings.preferences.theme" />
          {/* Try uncommenting: <StringInput schema={demoSchema} name="age" /> */}
          {/* ❌ Error: 'age' is number, not string */}

          {/* Number inputs - only accepts number paths */}
          <NumberInput schema={demoSchema} name="age" />
          <NumberInput schema={demoSchema} name="profile.followers" />
          {/* Try uncommenting: <NumberInput schema={demoSchema} name="name" /> */}
          {/* ❌ Error: 'name' is string, not number */}

          {/* Boolean inputs - only accepts boolean paths */}
          <BooleanInput schema={demoSchema} name="isActive" />
          <BooleanInput schema={demoSchema} name="profile.verified" />
          <BooleanInput
            schema={demoSchema}
            name="settings.notifications.email"
          />
          {/* Try uncommenting: <BooleanInput schema={demoSchema} name="age" /> */}
          {/* ❌ Error: 'age' is number, not boolean */}

          {/* Object sections - TPath auto-inferred from name prop! */}
          <ProfileSection schema={demoSchema} name="profile" />
          <AddressSection schema={demoSchema} name="addresses.0" />
          <NotificationsSection
            schema={demoSchema}
            name="settings.notifications"
          />
          {/* Try uncommenting: <ProfileSection schema={demoSchema} name="settings" /> */}
          {/* ❌ Error: 'settings' doesn't resolve to Profile type */}
        </div>

        <div className="bg-muted p-3 rounded-md text-xs">
          <p className="text-muted-foreground">
            <strong>Tip:</strong> Try changing the <code>name</code> prop values
            above to invalid paths - TypeScript will show an error!
          </p>
        </div>
      </div>

      <Separator />

      {/* String Paths */}
      <PathSection
        title="String Paths"
        description="All paths where the value type is string"
        paths={stringPaths}
        color="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        typeDefinition="type StringPaths = ValidPaths<typeof schema, never, never, string>"
      />

      <Separator />

      {/* Number Paths */}
      <PathSection
        title="Number Paths"
        description="All paths where the value type is number"
        paths={numberPaths}
        color="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        typeDefinition="type NumberPaths = ValidPaths<typeof schema, never, never, number>"
      />

      <Separator />

      {/* Boolean Paths */}
      <PathSection
        title="Boolean Paths"
        description="All paths where the value type is boolean"
        paths={booleanPaths}
        color="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
        typeDefinition="type BooleanPaths = ValidPaths<typeof schema, never, never, boolean>"
      />

      <Separator />

      {/* Object Paths */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">Object Paths</h3>
          <p className="text-sm text-muted-foreground">
            Filter paths by object shape - useful for nested form sections
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="bg-muted p-3 rounded-md mb-2">
              <code className="text-xs text-muted-foreground">
                {`type Profile = z.infer<typeof schema>['profile']`}
              </code>
              <br />
              <code className="text-xs text-muted-foreground">
                {`type ProfilePaths = ValidPaths<typeof schema, never, never, Profile>`}
              </code>
            </div>
            <div className="flex flex-wrap gap-2">
              {profilePaths.map((path) => (
                <PathBadge
                  key={path}
                  path={path}
                  color="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                />
              ))}
            </div>
          </div>

          <div>
            <div className="bg-muted p-3 rounded-md mb-2">
              <code className="text-xs text-muted-foreground">
                {`type Address = z.infer<typeof schema>['addresses'][number]`}
              </code>
              <br />
              <code className="text-xs text-muted-foreground">
                {`type AddressPaths = ValidPaths<typeof schema, never, never, Address>`}
              </code>
            </div>
            <div className="flex flex-wrap gap-2">
              {addressPaths.map((path) => (
                <PathBadge
                  key={path}
                  path={path}
                  color="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                />
              ))}
            </div>
          </div>

          <div>
            <div className="bg-muted p-3 rounded-md mb-2">
              <code className="text-xs text-muted-foreground">
                {`type Notifications = z.infer<typeof schema>['settings']['notifications']`}
              </code>
              <br />
              <code className="text-xs text-muted-foreground">
                {`type NotificationsPaths = ValidPaths<typeof schema, never, never, Notifications>`}
              </code>
            </div>
            <div className="flex flex-wrap gap-2">
              {notificationsPaths.map((path) => (
                <PathBadge
                  key={path}
                  path={path}
                  color="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Use Cases */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Actual Usage Examples</h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="mb-2">
              <strong>1. Type-safe form field components:</strong> Create input
              components that only accept paths matching their expected value
              type.
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {`// Only accepts paths that resolve to string values
// TPath is auto-inferred from the 'name' prop!
function StringInput<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, string>,
>({ schema, name }: { schema: TSchema; name: TPath }) {
  void schema; // used for type inference
  const { register } = useFormContext();
  return <input {...register(name)} />;
}

// Usage - no type params needed:
<StringInput schema={schema} name="profile.bio" />  // ✅ OK
<StringInput schema={schema} name="age" />          // ❌ Error: number`}
            </pre>
          </div>

          <div>
            <p className="mb-2">
              <strong>2. Number-only inputs with validation:</strong>
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {`function NumberInput<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, number>,
>({ schema, name, min, max }: {
  schema: TSchema;
  name: TPath;
  min?: number;
  max?: number;
}) {
  void schema;
  const { register } = useFormContext();
  return <input type="number" min={min} max={max} {...register(name)} />;
}

// Usage:
<NumberInput schema={schema} name="age" min={0} max={120} />  // ✅ OK
<NumberInput schema={schema} name="profile.followers" />      // ✅ OK
<NumberInput schema={schema} name="name" />                   // ❌ Error`}
            </pre>
          </div>

          <div>
            <p className="mb-2">
              <strong>3. Object section components with useWatch:</strong>
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {`type Profile = z.infer<typeof schema>['profile'];

// TPath is auto-inferred from the 'name' prop - no manual type params!
function ProfileSection<
  TSchema extends z.ZodType,
  TPath extends ValidPaths<TSchema, never, never, Profile>,
>({ schema, name }: { schema: TSchema; name: TPath }) {
  const { control } = useFormContext();
  const profileData = useWatch({ control, name });
  // profileData is typed as Profile: { bio, website, followers, verified }
  return (
    <div>
      <p>Bio: {profileData.bio}</p>
      <p>Followers: {profileData.followers}</p>
    </div>
  );
}

// Usage - TPath inferred automatically:
<ProfileSection schema={schema} name="profile" />  // ✅ OK
<ProfileSection schema={schema} name="settings" /> // ❌ Error: wrong type`}
            </pre>
          </div>

          <div>
            <p className="mb-2">
              <strong>4. Array item rendering with type safety:</strong>
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {`type Address = z.infer<typeof schema>['addresses'][number];

function AddressCard<TPath extends ValidPaths<typeof schema, never, never, Address>>({
  name,
}: {
  name: TPath;
}) {
  const { control } = useFormContext();
  const address = useWatch({ control, name });
  // address is typed as Address: { street, city, zipCode, isPrimary }
  return (
    <div className={address.isPrimary ? 'border-primary' : ''}>
      <p>{address.street}, {address.city} {address.zipCode}</p>
    </div>
  );
}

// Usage with useFieldArray:
const { fields } = useFieldArray({ control, name: 'addresses' });
{fields.map((_, index) => (
  <AddressCard key={index} name={\`addresses.\${index}\`} />  // ✅ Type-safe
))}`}
            </pre>
          </div>

          <div>
            <p className="mb-2">
              <strong>5. Bulk operations on paths of same type:</strong>
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {`// Reset all boolean fields to false
type BoolPaths = ValidPaths<typeof schema, never, never, boolean>;
const booleanFields: BoolPaths[] = [
  'isActive',
  'profile.verified',
  'settings.notifications.email',
  'settings.notifications.sms',
];

function resetBooleans(form: UseFormReturn<z.infer<typeof schema>>) {
  booleanFields.forEach((path) => {
    form.setValue(path, false);  // ✅ Type-safe: path resolves to boolean
  });
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscriminatedSchemaContent() {
  return (
    <div className="space-y-6">
      {/* Schema Display */}
      <div>
        <h3 className="font-semibold text-sm mb-2">
          Discriminated Union Schema
        </h3>
        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto max-h-80 overflow-y-auto">
          {`const schema = z.discriminatedUnion('type', [
  // PERSONAL variant
  z.object({
    type: z.literal('personal'),
    firstName: z.string(),
    lastName: z.string(),
    age: z.number(),
    isStudent: z.boolean(),
    // Nested object
    emergencyContact: z.object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    }),
    // Array of objects
    education: z.array(z.object({
      school: z.string(),
      degree: z.string(),
      graduationYear: z.number(),
    })),
    // Deeply nested
    preferences: z.object({
      notifications: z.object({
        email: z.boolean(),
        sms: z.boolean(),
      }),
    }),
  }),
  // BUSINESS variant
  z.object({
    type: z.literal('business'),
    companyName: z.string(),
    taxId: z.string(),
    employeeCount: z.number(),
    isPublic: z.boolean(),
    // Nested object
    headquarters: z.object({
      address: z.string(),
      city: z.string(),
      country: z.string(),
    }),
    // Array of objects
    departments: z.array(z.object({
      name: z.string(),
      headCount: z.number(),
      budget: z.number(),
    })),
    // Deeply nested
    compliance: z.object({
      certifications: z.object({
        iso9001: z.boolean(),
        iso27001: z.boolean(),
      }),
    }),
  }),
]);`}
        </pre>
      </div>

      <Separator />

      {/* Interactive Demo */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">Interactive Demo</h3>
          <p className="text-sm text-muted-foreground">
            Each variant has completely different fields. ValidPaths filters by
            discriminator value - try hovering in VS Code!
          </p>
        </div>

        <div className="grid gap-6">
          {/* Personal variant */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Personal Variant (type: 'personal')
            </h4>
            <div className="grid gap-2 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
              {/* Primitives */}
              <PersonalStringInput name="firstName" />
              <PersonalStringInput name="lastName" />
              <PersonalNumberInput name="age" />
              <PersonalBooleanInput name="isStudent" />
              {/* Nested object paths */}
              <PersonalStringInput name="emergencyContact.name" />
              <PersonalStringInput name="emergencyContact.phone" />
              {/* Array paths */}
              <PersonalStringInput name="education.0.school" />
              <PersonalNumberInput name="education.0.graduationYear" />
              {/* Deeply nested */}
              <PersonalBooleanInput name="preferences.notifications.email" />
              {/* Object sections */}
              <PersonalEmergencyContactSection name="emergencyContact" />
              <PersonalEducationSection name="education.0" />
              <PersonalNotificationsSection name="preferences.notifications" />
              {/* ❌ Try: <PersonalStringInput name="companyName" /> - Error! */}
            </div>
          </div>

          {/* Business variant */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Business Variant (type: 'business')
            </h4>
            <div className="grid gap-2 pl-4 border-l-2 border-amber-200 dark:border-amber-800">
              {/* Primitives */}
              <BusinessStringInput name="companyName" />
              <BusinessStringInput name="taxId" />
              <BusinessNumberInput name="employeeCount" />
              <BusinessBooleanInput name="isPublic" />
              {/* Nested object paths */}
              <BusinessStringInput name="headquarters.address" />
              <BusinessStringInput name="headquarters.city" />
              {/* Array paths */}
              <BusinessStringInput name="departments.0.name" />
              <BusinessNumberInput name="departments.0.headCount" />
              {/* Deeply nested */}
              <BusinessBooleanInput name="compliance.certifications.iso9001" />
              {/* Object sections */}
              <BusinessHeadquartersSection name="headquarters" />
              <BusinessDepartmentSection name="departments.0" />
              <BusinessCertificationsSection name="compliance.certifications" />
              {/* ❌ Try: <BusinessStringInput name="firstName" /> - Error! */}
            </div>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-md text-xs">
          <p className="text-muted-foreground">
            <strong>Key Insight:</strong> Personal and Business variants have
            completely different nested structures. ValidPaths ensures you can
            only use paths that exist in the selected variant!
          </p>
        </div>
      </div>

      <Separator />

      {/* Path Sections - Personal */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-indigo-600 dark:text-indigo-400">
          Personal Variant Paths
        </h3>
        <PathSection
          title="String Paths"
          description="All string paths in personal variant"
          paths={personalStringPaths}
          color="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
          typeDefinition="ValidPaths<typeof schema, 'type', 'personal', string>"
        />
        <PathSection
          title="Number Paths"
          description="All number paths in personal variant"
          paths={personalNumberPaths}
          color="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
          typeDefinition="ValidPaths<typeof schema, 'type', 'personal', number>"
        />
        <PathSection
          title="Boolean Paths"
          description="All boolean paths in personal variant"
          paths={personalBooleanPaths}
          color="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
          typeDefinition="ValidPaths<typeof schema, 'type', 'personal', boolean>"
        />
      </div>

      <Separator />

      {/* Path Sections - Business */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-amber-600 dark:text-amber-400">
          Business Variant Paths
        </h3>
        <PathSection
          title="String Paths"
          description="All string paths in business variant"
          paths={businessStringPaths}
          color="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
          typeDefinition="ValidPaths<typeof schema, 'type', 'business', string>"
        />
        <PathSection
          title="Number Paths"
          description="All number paths in business variant"
          paths={businessNumberPaths}
          color="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
          typeDefinition="ValidPaths<typeof schema, 'type', 'business', number>"
        />
        <PathSection
          title="Boolean Paths"
          description="All boolean paths in business variant"
          paths={businessBooleanPaths}
          color="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
          typeDefinition="ValidPaths<typeof schema, 'type', 'business', boolean>"
        />
      </div>

      <Separator />

      {/* Usage Example */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Usage Example</h3>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
          {`// Define type-safe input for personal variant only
type PersonalStringPaths = ValidPaths<
  typeof schema,
  'type',      // discriminator key
  'personal',  // discriminator value
  string       // filter type
>;

function PersonalStringInput<TPath extends PersonalStringPaths>({
  name,
}: { name: TPath }) {
  const { register } = useFormContext();
  return <input {...register(name)} />;
}

// Usage - only personal fields allowed:
<PersonalStringInput name="firstName" />              // ✅ OK
<PersonalStringInput name="emergencyContact.name" />  // ✅ OK (nested)
<PersonalStringInput name="education.0.school" />     // ✅ OK (array)
<PersonalStringInput name="companyName" />            // ❌ Error!
<PersonalStringInput name="headquarters.city" />      // ❌ Error!`}
        </pre>
      </div>
    </div>
  );
}
