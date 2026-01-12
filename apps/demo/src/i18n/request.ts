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

  // Load all namespace files - using static import for type safety
  const userModule = await import('../lang/en/user.json');
  const user = userModule.default;

  const messages: NamespaceMessages = {
    user,
  };

  return {
    locale,
    messages,
  };
});
