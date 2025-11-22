// Zod schema utilities

// Zod defaults extraction
export { extractDefault, getSchemaDefaults } from './defaults';
export {
  canUnwrap,
  extractDiscriminatedSchema,
  getFieldChecks,
  getPrimitiveType,
  removeDefault,
  requiresValidInput,
  tryStripNullishOnly,
  type ZodUnionCheck,
} from './schema';

// Type utilities
export type { Simplify } from './types';
