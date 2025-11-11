import { bench, describe } from 'vitest';
import { z } from 'zod';
import {
  canUnwrap,
  getPrimitiveType,
  removeDefault,
  requiresValidInput,
} from '../src/schema';

describe('Schema Utilities Benchmarks', () => {
  // Test schemas for requiresValidInput
  const requiredString = z.string().min(1);
  const optionalString = z.string().optional();
  const nullableString = z.string().nullable();
  const stringWithDefault = z.string().default('test');
  const requiredArray = z.array(z.string()).min(1);
  const optionalArray = z.array(z.string()).optional();

  // Test schemas for getPrimitiveType
  const stringSchema = z.string();
  const numberSchema = z.number();
  const booleanSchema = z.boolean();
  const dateSchema = z.date();
  const optionalStringSchema = z.string().optional();
  const nullableNumberSchema = z.number().nullable();
  const defaultedBooleanSchema = z.boolean().default(true);

  // Test schemas for removeDefault
  const schemaWithDefault = z.string().default('default value');
  const nestedSchemaWithDefault = z
    .object({
      field: z.string().default('nested'),
    })
    .default({ field: 'nested' });

  // Test schemas for canUnwrap
  const unwrappableOptional = z.string().optional();
  const unwrappableNullable = z.string().nullable();
  const unwrappableDefault = z.string().default('test');
  const nonUnwrappableString = z.string();

  bench('requiresValidInput - required string', () => {
    requiresValidInput(requiredString);
  });

  bench('requiresValidInput - optional string', () => {
    requiresValidInput(optionalString);
  });

  bench('requiresValidInput - nullable string', () => {
    requiresValidInput(nullableString);
  });

  bench('requiresValidInput - string with default', () => {
    requiresValidInput(stringWithDefault);
  });

  bench('requiresValidInput - required array', () => {
    requiresValidInput(requiredArray);
  });

  bench('requiresValidInput - optional array', () => {
    requiresValidInput(optionalArray);
  });

  bench('getPrimitiveType - string', () => {
    getPrimitiveType(stringSchema);
  });

  bench('getPrimitiveType - number', () => {
    getPrimitiveType(numberSchema);
  });

  bench('getPrimitiveType - boolean', () => {
    getPrimitiveType(booleanSchema);
  });

  bench('getPrimitiveType - date', () => {
    getPrimitiveType(dateSchema);
  });

  bench('getPrimitiveType - optional string', () => {
    getPrimitiveType(optionalStringSchema);
  });

  bench('getPrimitiveType - nullable number', () => {
    getPrimitiveType(nullableNumberSchema);
  });

  bench('getPrimitiveType - defaulted boolean', () => {
    getPrimitiveType(defaultedBooleanSchema);
  });

  bench('removeDefault - schema with default', () => {
    removeDefault(schemaWithDefault);
  });

  bench('removeDefault - nested schema with default', () => {
    removeDefault(nestedSchemaWithDefault);
  });

  bench('canUnwrap - optional', () => {
    canUnwrap(unwrappableOptional);
  });

  bench('canUnwrap - nullable', () => {
    canUnwrap(unwrappableNullable);
  });

  bench('canUnwrap - default', () => {
    canUnwrap(unwrappableDefault);
  });

  bench('canUnwrap - non-unwrappable', () => {
    canUnwrap(nonUnwrappableString);
  });
});
