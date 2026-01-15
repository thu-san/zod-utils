'use client';

import {
  FormSchemaProvider,
  getSchemaDefaults,
  useIsRequiredField,
  useZodForm,
} from '@zod-utils/react-hook-form';
import Link from 'next/link';
import { useState } from 'react';
import { FormProvider, useFormContext, useWatch } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formErrorHandler } from '@/lib/error-map';

// Define the schema for a multi-step registration form
const registrationSchema = z.object({
  // Step 1: Personal Info
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),

  // Step 2: Address
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(5, 'Zip code must be at least 5 characters'),

  // Step 3: Preferences
  newsletter: z.boolean().default(false),
  notifications: z.boolean().default(true),
});

type RegistrationData = z.infer<typeof registrationSchema>;

// ============================================
// Child Components using useFormContext
// ============================================

/**
 * Step 1: Personal Information
 * Demonstrates basic useFormContext usage
 */
function PersonalInfoStep() {
  const { register, formState } = useFormContext<RegistrationData>();
  const { errors } = formState;

  // Using useIsRequiredField hook to check if field is required
  const isFirstNameRequired = useIsRequiredField({
    schema: registrationSchema,
    name: 'firstName',
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 1: Personal Information</h3>
      <p className="text-sm text-muted-foreground">
        This component uses <code>useFormContext()</code> to access form methods
      </p>

      <div className="space-y-3">
        <div>
          <Label htmlFor="firstName">
            First Name
            {isFirstNameRequired && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Step 2: Address Information
 * Demonstrates useFormContext with different field group
 */
function AddressStep() {
  const { register, formState } = useFormContext<RegistrationData>();
  const { errors } = formState;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 2: Address</h3>
      <p className="text-sm text-muted-foreground">
        Another component accessing the same form via context
      </p>

      <div className="space-y-3">
        <div>
          <Label htmlFor="street">
            Street <span className="text-red-500">*</span>
          </Label>
          <Input
            id="street"
            {...register('street')}
            placeholder="Enter street address"
          />
          {errors.street && (
            <p className="text-sm text-red-500 mt-1">{errors.street.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="city">
            City <span className="text-red-500">*</span>
          </Label>
          <Input id="city" {...register('city')} placeholder="Enter city" />
          {errors.city && (
            <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="zipCode">
            Zip Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="zipCode"
            {...register('zipCode')}
            placeholder="Enter zip code"
          />
          {errors.zipCode && (
            <p className="text-sm text-red-500 mt-1">
              {errors.zipCode.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Step 3: Preferences
 * Demonstrates useFormContext with boolean fields
 */
function PreferencesStep() {
  const { register } = useFormContext<RegistrationData>();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 3: Preferences</h3>
      <p className="text-sm text-muted-foreground">
        Optional preferences using checkbox inputs
      </p>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="newsletter"
            {...register('newsletter')}
            className="h-4 w-4"
          />
          <Label htmlFor="newsletter">Subscribe to newsletter</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="notifications"
            {...register('notifications')}
            className="h-4 w-4"
          />
          <Label htmlFor="notifications">Enable notifications</Label>
        </div>
      </div>
    </div>
  );
}

/**
 * Live Preview Component
 * Demonstrates useWatch to reactively display form values
 */
function LivePreview() {
  const { control } = useFormContext<RegistrationData>();

  // useWatch subscribes to form values and re-renders when they change
  const firstName = useWatch({ control, name: 'firstName' });
  const lastName = useWatch({ control, name: 'lastName' });
  const email = useWatch({ control, name: 'email' });
  const city = useWatch({ control, name: 'city' });

  return (
    <div className="p-3 bg-muted rounded-md space-y-2">
      <p className="text-sm font-semibold">Live Preview (useWatch)</p>
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          Name:{' '}
          <span className="text-foreground">
            {firstName || '...'} {lastName || '...'}
          </span>
        </p>
        <p>
          Email: <span className="text-foreground">{email || '...'}</span>
        </p>
        <p>
          City: <span className="text-foreground">{city || '...'}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Step Indicator
 * Shows which step is active using context
 */
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Personal', 'Address', 'Preferences'];

  return (
    <div className="flex justify-between mb-6">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {index + 1}
          </div>
          <span className="ml-2 text-sm hidden sm:inline">{step}</span>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${
                index < currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function FormProviderPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const form = useZodForm({
    schema: registrationSchema,
    defaultValues: getSchemaDefaults({ schema: registrationSchema }),
    zodResolverOptions: {
      error: formErrorHandler,
    },
  });

  // Fields to validate per step
  const stepFields: Array<Array<keyof RegistrationData>> = [
    ['firstName', 'lastName', 'email'],
    ['street', 'city', 'zipCode'],
    ['newsletter', 'notifications'],
  ];

  const nextStep = async () => {
    // Validate only the current step's fields
    const isValid = await form.trigger(stepFields[currentStep]);
    if (isValid && currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  function onSubmit(data: RegistrationData) {
    toast('Registration submitted!', {
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
    <FormSchemaProvider schema={registrationSchema}>
      {/*
        FormProvider from react-hook-form makes the form methods
        available to all child components via useFormContext()
      */}
      <FormProvider {...form}>
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
          <Card className="w-full sm:max-w-lg">
            <CardHeader>
              <CardTitle>FormProvider Demo</CardTitle>
              <CardDescription>
                Multi-step wizard using{' '}
                <code className="text-xs">FormProvider</code> and{' '}
                <code className="text-xs">useFormContext</code>
              </CardDescription>

              {/* Navigation */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/create-edit">Discriminated Union</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">Main Demo</Link>
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 rounded-md text-sm space-y-2">
                <p className="font-semibold text-blue-700 dark:text-blue-400">
                  Key Concepts Demonstrated:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                  <li>
                    <code>FormProvider</code> wraps form to share context
                  </li>
                  <li>
                    <code>useFormContext()</code> in child components
                  </li>
                  <li>
                    <code>useWatch()</code> for reactive value display
                  </li>
                  <li>
                    Per-step validation with <code>trigger()</code>
                  </li>
                </ul>
              </div>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <StepIndicator currentStep={currentStep} />

                {/* Live Preview - uses useWatch internally */}
                <LivePreview />

                {/* Step Content - each is a separate component using useFormContext */}
                <div className="min-h-[200px]">
                  {currentStep === 0 && <PersonalInfoStep />}
                  {currentStep === 1 && <AddressStep />}
                  {currentStep === 2 && <PreferencesStep />}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>

                  {currentStep < 2 ? (
                    <Button type="button" onClick={nextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit">Submit</Button>
                  )}
                </div>

                {/* Reset Button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      form.reset();
                      setCurrentStep(0);
                    }}
                  >
                    Reset Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </FormProvider>
    </FormSchemaProvider>
  );
}
