import 'zod';
import type { JSONSchemaMeta } from 'zod/v4/core';
import type { translationKeys } from './i18n';

declare module 'zod' {
  interface GlobalMeta extends JSONSchemaMeta {
    translationKey: translationKeys;
  }
}
