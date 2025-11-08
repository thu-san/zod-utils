import type { ZodErrorMap } from 'zod';

const Nouns: Record<string, string> = {
  regex: '入力値',
  email: 'メールアドレス',
  url: 'URL',
  emoji: '絵文字',
  uuid: 'UUID',
  uuidv4: 'UUIDv4',
  uuidv6: 'UUIDv6',
  nanoid: 'nanoid',
  guid: 'GUID',
  cuid: 'cuid',
  cuid2: 'cuid2',
  ulid: 'ULID',
  xid: 'XID',
  ksuid: 'KSUID',
  datetime: 'ISO日時',
  date: 'ISO日付',
  time: 'ISO時刻',
  duration: 'ISO期間',
  ipv4: 'IPv4アドレス',
  ipv6: 'IPv6アドレス',
  cidrv4: 'IPv4範囲',
  cidrv6: 'IPv6範囲',
  base64: 'base64エンコード文字列',
  base64url: 'base64urlエンコード文字列',
  json_string: 'JSON文字列',
  e164: 'E.164番号',
  jwt: 'JWT',
  template_literal: '入力値',
};

function stringifyPrimitive(value: unknown): string {
  if (typeof value === 'bigint') return `${value.toString()}n`;
  if (typeof value === 'string') return `"${value}"`;
  return `${value}`;
}

type Primitive = string | number | symbol | bigint | boolean | null | undefined;
function joinValues<T extends Primitive[]>(array: T, separator = '、'): string {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}

const Sizable: Record<string, { unit: string; verb: string }> = {
  string: { unit: '文字', verb: 'である' },
  file: { unit: 'バイト', verb: 'である' },
  array: { unit: '要素', verb: 'である' },
  set: { unit: '要素', verb: 'である' },
};

function getSizing(origin: string): { unit: string; verb: string } | null {
  return Sizable[origin] ?? null;
}

function parsedType(data: unknown): string {
  const t = typeof data;

  switch (t) {
    case 'number': {
      return Number.isNaN(data) ? 'NaN' : '数値';
    }
    case 'object': {
      if (Array.isArray(data)) {
        return '配列';
      }
      if (data === null) {
        return 'null';
      }

      if (
        Object.getPrototypeOf(data) !== Object.prototype &&
        data &&
        data.constructor
      ) {
        return data.constructor.name;
      }
    }
  }
  return t;
}

/**
 * Japanese error map for Zod validation errors
 * @param fieldName - Optional custom field name to use in error messages
 * @returns Zod error map function
 */
export function createJapaneseErrorMap(
  fieldName?: string,
): (issue: Parameters<ZodErrorMap>[0]) => string {
  return (issue: Parameters<ZodErrorMap>[0]) => {
    const field = fieldName || 'この項目';

    switch (issue.code) {
      case 'custom': {
        return '無効な入力';
      }
      case 'invalid_type':
        return `無効な入力: ${issue.expected}が期待されましたが、${parsedType(issue.input)}が入力されました`;
      case 'invalid_value':
        if (issue.values.length === 1)
          return `無効な入力: ${stringifyPrimitive(issue.values[0])}が期待されました`;
        return `無効な選択: ${joinValues(issue.values)}のいずれかである必要があります`;
      case 'too_big': {
        const adj = issue.inclusive ? '以下である' : 'より小さい';
        const sizing = getSizing(issue.origin);
        if (sizing)
          return `大きすぎる値: ${field}は${issue.maximum.toString()}${sizing.unit}${adj}必要があります`;
        return `大きすぎる値: ${field}は${issue.maximum.toString()}${adj}必要があります`;
      }
      case 'too_small': {
        const adj = issue.inclusive ? '以上である' : 'より大きい';
        const sizing = getSizing(issue.origin);
        if (issue.minimum === 1) {
          return '必須項目です';
        }
        if (sizing)
          return `小さすぎる値: ${field}は${issue.minimum.toString()}${sizing.unit}${adj}必要があります`;
        return `小さすぎる値: ${field}は${issue.minimum.toString()}${adj}必要があります`;
      }
      case 'invalid_format': {
        const _issue = issue as Extract<
          Parameters<ZodErrorMap>[0],
          { code: 'invalid_format' }
        >;
        if (_issue.format === 'starts_with')
          return `無効な文字列: "${_issue.prefix}"で始まる必要があります`;
        if (_issue.format === 'ends_with')
          return `無効な文字列: "${_issue.suffix}"で終わる必要があります`;
        if (_issue.format === 'includes')
          return `無効な文字列: "${_issue.includes}"を含む必要があります`;
        if (_issue.format === 'regex')
          return `無効な文字列: パターン${_issue.pattern}に一致する必要があります`;
        return `無効な${Nouns[_issue.format] ?? issue.format}`;
      }
      case 'not_multiple_of':
        return `無効な数値: ${issue.divisor}の倍数である必要があります`;
      case 'unrecognized_keys':
        return `認識されていないキー${issue.keys.length > 1 ? '群' : ''}: ${joinValues(issue.keys)}`;
      case 'invalid_key':
        return `${field}内の無効なキー`;
      case 'invalid_union':
        return '無効な入力';
      case 'invalid_element':
        return `${field}内の無効な値`;
      default:
        return '無効な入力';
    }
  };
}
