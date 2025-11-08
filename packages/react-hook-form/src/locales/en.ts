import type { ZodErrorMap } from 'zod';

const Nouns: Record<string, string> = {
  regex: 'input',
  email: 'email address',
  url: 'URL',
  emoji: 'emoji',
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
  datetime: 'ISO datetime',
  date: 'ISO date',
  time: 'ISO time',
  duration: 'ISO duration',
  ipv4: 'IPv4 address',
  ipv6: 'IPv6 address',
  cidrv4: 'IPv4 CIDR',
  cidrv6: 'IPv6 CIDR',
  base64: 'base64 encoded string',
  base64url: 'base64url encoded string',
  json_string: 'JSON string',
  e164: 'E.164 phone number',
  jwt: 'JWT',
  template_literal: 'input',
};

function stringifyPrimitive(value: unknown): string {
  if (typeof value === 'bigint') return `${value.toString()}n`;
  if (typeof value === 'string') return `"${value}"`;
  return `${value}`;
}

type Primitive = string | number | symbol | bigint | boolean | null | undefined;
function joinValues<T extends Primitive[]>(
  array: T,
  separator = ' | ',
): string {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}

const Sizable: Record<string, string> = {
  string: 'character',
  file: 'byte',
  array: 'item',
  set: 'item',
};

function getSizing(origin: string): string | null {
  return Sizable[origin] ?? null;
}

function parsedType(data: unknown): string {
  const t = typeof data;

  switch (t) {
    case 'number': {
      return Number.isNaN(data) ? 'NaN' : 'number';
    }
    case 'object': {
      if (Array.isArray(data)) {
        return 'array';
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
 * English error map for Zod validation errors
 * @param fieldName - Optional custom field name to use in error messages
 * @returns Zod error map function
 */
export function createEnglishErrorMap(
  fieldName?: string,
): (issue: Parameters<ZodErrorMap>[0]) => string {
  return (issue: Parameters<ZodErrorMap>[0]) => {
    const field = fieldName || 'This field';

    switch (issue.code) {
      case 'custom': {
        return 'Invalid input';
      }
      case 'invalid_type':
        return `Invalid type: expected ${issue.expected}, received ${parsedType(issue.input)}`;
      case 'invalid_value':
        if (issue.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
        return `Invalid option: must be one of ${joinValues(issue.values)}`;
      case 'too_big': {
        const unit = getSizing(issue.origin);
        const plural = issue.maximum !== 1 ? 's' : '';
        if (unit) {
          return issue.inclusive
            ? `${field} must be at most ${issue.maximum} ${unit}${plural}`
            : `${field} must be less than ${issue.maximum} ${unit}${plural}`;
        }
        return issue.inclusive
          ? `${field} must be at most ${issue.maximum}`
          : `${field} must be less than ${issue.maximum}`;
      }
      case 'too_small': {
        const unit = getSizing(issue.origin);
        const plural = issue.minimum !== 1 ? 's' : '';
        if (issue.minimum === 1 && !unit) {
          return `${field} is required`;
        }
        if (unit) {
          return issue.inclusive
            ? `${field} must be at least ${issue.minimum} ${unit}${plural}`
            : `${field} must be greater than ${issue.minimum} ${unit}${plural}`;
        }
        return issue.inclusive
          ? `${field} must be at least ${issue.minimum}`
          : `${field} must be greater than ${issue.minimum}`;
      }
      case 'invalid_format': {
        const _issue = issue as Extract<
          Parameters<ZodErrorMap>[0],
          { code: 'invalid_format' }
        >;
        if (_issue.format === 'starts_with')
          return `Invalid string: must start with "${_issue.prefix}"`;
        if (_issue.format === 'ends_with')
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === 'includes')
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === 'regex')
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${Nouns[_issue.format] ?? _issue.format}`;
      }
      case 'not_multiple_of':
        return `Invalid number: must be a multiple of ${issue.divisor}`;
      case 'unrecognized_keys':
        return `Unrecognized key${issue.keys.length > 1 ? 's' : ''}: ${joinValues(issue.keys)}`;
      case 'invalid_key':
        return `Invalid key in ${field}`;
      case 'invalid_union':
        return 'Invalid input';
      case 'invalid_element':
        return `Invalid value in ${field}`;
      default:
        return 'Invalid input';
    }
  };
}
