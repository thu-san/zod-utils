import { getRequestConfig } from 'next-intl/server';
import type userJSON from '@/lang/en/user.json';

// Define namespace messages type
const NamespaceMessages = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  user: {} as typeof userJSON,
} as const;

export type NamespaceMessages = typeof NamespaceMessages;

// Augment next-intl module for type safety
declare module 'next-intl' {
  interface AppConfig {
    Locale: 'en';
    Messages: NamespaceMessages;
  }
}

export default getRequestConfig(async () => {
  const locale = 'en';

  // Load all namespace files and merge them
  const user = (await import(`../lang/${locale}/user.json`)).default;

  const messages = {
    user,
  };

  return {
    locale,
    messages,
  };
});
