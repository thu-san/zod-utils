import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { customErrorResolver, FieldNamespaceMapping } from '../error-map';

describe('customErrorResolver', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return custom error message', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'custom',
      message: '',
      path: ['groupName'],
      input: undefined,
    });

    expect(result).toBe('無効な入力');
  });

  it('should handle invalid_type error', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_type',
      message: '',
      path: ['groupName'],
      expected: 'string',
      input: 123,
    });

    expect(result).toContain('無効な入力');
    expect(result).toContain('string');
    expect(result).toContain('数値');
  });

  it('should handle invalid_value error with single value', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_value',
      message: '',
      path: ['groupName'],
      values: ['valid'],
      input: 'invalid',
    });

    expect(result).toContain('無効な入力');
    expect(result).toContain('"valid"');
  });

  it('should handle invalid_value error with multiple values', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_value',
      message: '',
      path: ['groupName'],
      values: ['a', 'b', 'c'],
      input: 'd',
    });

    expect(result).toContain('無効な選択');
    expect(result).toContain('"a"');
    expect(result).toContain('"b"');
    expect(result).toContain('"c"');
  });

  it('should handle too_big error for strings', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'too_big',
      message: '',
      path: ['groupName'],
      maximum: 10,
      inclusive: true,
      origin: 'string',
      input: 'very long string that exceeds maximum',
    });

    expect(result).toContain('大きすぎる値');
    expect(result).toContain('10');
    expect(result).toContain('文字');
    expect(result).toContain('部署・店舗名');
  });

  it('should handle too_small error with minimum 1', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'too_small',
      message: '',
      path: ['groupName'],
      minimum: 1,
      inclusive: true,
      origin: 'string',
      input: '',
    });

    expect(result).toBe('必須項目です');
  });

  it('should handle too_small error for strings', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'too_small',
      message: '',
      path: ['groupName'],
      minimum: 3,
      inclusive: true,
      origin: 'string',
      input: 'ab',
    });

    expect(result).toContain('小さすぎる値');
    expect(result).toContain('3');
    expect(result).toContain('文字');
  });

  it('should handle too_small error for arrays', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'too_small',
      message: '',
      path: ['items'],
      minimum: 2,
      inclusive: true,
      origin: 'array',
      input: [1],
    });

    expect(result).toContain('2');
    expect(result).toContain('要素');
  });

  it('should handle invalid_format error for starts_with', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_format',
      message: '',
      path: ['groupName'],
      format: 'starts_with',
      prefix: 'test',
      input: 'something',
    });

    expect(result).toContain('無効な文字列');
    expect(result).toContain('"test"');
    expect(result).toContain('で始まる');
  });

  it('should handle invalid_format error for ends_with', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_format',
      message: '',
      path: ['groupName'],
      format: 'ends_with',
      suffix: '.com',
      input: 'example.org',
    });

    expect(result).toContain('無効な文字列');
    expect(result).toContain('".com"');
    expect(result).toContain('で終わる');
  });

  it('should handle invalid_format error for includes', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_format',
      message: '',
      path: ['groupName'],
      format: 'includes',
      includes: '@',
      input: 'example.com',
    });

    expect(result).toContain('無効な文字列');
    expect(result).toContain('"@"');
    expect(result).toContain('を含む');
  });

  it('should handle invalid_format error for email', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_format',
      message: '',
      path: ['groupName'],
      format: 'email',
      input: 'not-an-email',
    });

    expect(result).toContain('無効なメールアドレス');
  });

  it('should handle invalid_format error for url', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_format',
      message: '',
      path: ['groupName'],
      format: 'url',
      input: 'not-a-url',
    });

    expect(result).toContain('無効なURL');
  });

  it('should handle not_multiple_of error', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'not_multiple_of',
      message: '',
      path: ['groupName'],
      divisor: 5,
      input: 13,
    });

    expect(result).toContain('無効な数値');
    expect(result).toContain('5');
    expect(result).toContain('倍数');
  });

  it('should handle unrecognized_keys error with single key', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'unrecognized_keys',
      message: '',
      path: ['groupName'],
      keys: ['extra'],
      input: { groupName: 'test', extra: 'value' },
    });

    expect(result).toContain('認識されていないキー');
    expect(result).toContain('"extra"');
  });

  it('should handle unrecognized_keys error with multiple keys', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'unrecognized_keys',
      message: '',
      path: ['groupName'],
      keys: ['extra1', 'extra2'],
      input: { groupName: 'test', extra1: 'a', extra2: 'b' },
    });

    expect(result).toContain('認識されていないキー群');
    expect(result).toContain('"extra1"');
    expect(result).toContain('"extra2"');
  });

  it('should handle invalid_key error', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_key',
      message: '',
      path: ['groupName'],
      input: 123,
      origin: 'record' as const,
      issues: [],
    });

    expect(result).toContain('部署・店舗名');
    expect(result).toContain('無効なキー');
  });

  it('should handle invalid_union error', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_union',
      message: '',
      path: ['groupName'],
      input: 'invalid',
      errors: [[]],
    });

    expect(result).toBe('無効な入力');
  });

  it('should handle invalid_element error', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'invalid_element',
      message: '',
      path: ['groupName'],
      input: 'invalid',
      origin: 'set' as const,
      issues: [],
      key: 'groupName',
    });

    expect(result).toContain('部署・店舗名');
    expect(result).toContain('無効な値');
  });

  it('should use fallback field name for unknown fields', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'too_small',
      message: '',
      path: ['unknownField'],
      minimum: 1,
      inclusive: true,
      origin: 'string',
      input: '',
    });

    expect(result).toBe('必須項目です');
  });

  it('should handle empty path', () => {
    const resolver = customErrorResolver({ fieldNamespace: 'department' });

    const result = resolver({
      code: 'custom',
      message: '',
      path: [],
      input: undefined,
    });

    expect(result).toBe('無効な入力');
  });
});

describe('FieldNamespaceMapping', () => {
  it('should have department namespace', () => {
    expect(FieldNamespaceMapping.department).toBeDefined();
  });

  it('should have groupName in department namespace', () => {
    expect(FieldNamespaceMapping.department.groupName).toBe('部署・店舗名');
  });

  it('should be extensible', () => {
    // Type check that it can be extended
    const extended: typeof FieldNamespaceMapping = {
      ...FieldNamespaceMapping,
      // Users can add more namespaces
    };

    expect(extended).toBeDefined();
  });
});
