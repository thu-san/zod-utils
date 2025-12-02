import type { $ZodErrorMap } from 'zod/v4/core';

/**
 * Custom error map to show "Required" instead of "expected string, received undefined".
 * This is needed because we don't set empty string defaults on Zod schemas.
 */
export const formErrorHandler: $ZodErrorMap = (issue) => {
  if (issue.message) {
    return null;
  }

  if (issue.code === 'invalid_type' && issue.input === undefined) {
    return { message: 'Required' };
  }

  return null;
};
