'use strict';

var z = require('zod');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var z__namespace = /*#__PURE__*/_interopNamespace(z);

// src/schema.ts
var getPrimitiveType = (field, options) => {
  var _a;
  const unwrapArrays = (_a = options == null ? void 0 : options.unwrapArrays) != null ? _a : false;
  if (!unwrapArrays && field.type === "array") {
    return field;
  }
  if ("unwrap" in field && typeof field.unwrap === "function") {
    return getPrimitiveType(field.unwrap());
  }
  return field;
};
function removeDefault(field) {
  if (field instanceof z__namespace.ZodDefault) {
    return field.unwrap();
  }
  if ("innerType" in field.def) {
    const inner = removeDefault(field.def.innerType);
    if (field instanceof z__namespace.ZodOptional) {
      return inner.optional();
    }
    if (field instanceof z__namespace.ZodNullable) {
      return inner.nullable();
    }
  }
  return field;
}
var checkIfFieldIsRequired = (field) => {
  const undefinedResult = removeDefault(field).safeParse(void 0).success;
  const nullResult = field.safeParse(null).success;
  const primitiveType = getPrimitiveType(field);
  const emptyStringResult = primitiveType.type === "string" && field.safeParse("").success;
  const emptyArrayResult = primitiveType.type === "array" && field.safeParse([]).success;
  return !undefinedResult && !nullResult && !emptyStringResult && !emptyArrayResult;
};
function extractDefault(field) {
  if (field instanceof z__namespace.ZodDefault) {
    const defaultValue = field._def.defaultValue;
    return typeof defaultValue === "function" ? defaultValue() : defaultValue;
  }
  if ("unwrap" in field && typeof field.unwrap === "function") {
    return extractDefault(field.unwrap());
  }
  return void 0;
}
function getUnwrappedType(field) {
  if (field instanceof z__namespace.ZodDefault) {
    return field;
  }
  if ("unwrap" in field && typeof field.unwrap === "function") {
    return getUnwrappedType(field.unwrap());
  }
  return field;
}
function getSchemaDefaults(schema) {
  const defaults = {};
  for (const key in schema.shape) {
    const field = schema.shape[key];
    const defaultValue = extractDefault(field);
    if (defaultValue !== void 0) {
      defaults[key] = defaultValue;
      continue;
    }
    const unwrapped = getUnwrappedType(field);
    if (unwrapped instanceof z__namespace.ZodObject) {
      const nestedDefaults = getSchemaDefaults(unwrapped);
      if (Object.keys(nestedDefaults).length > 0) {
        defaults[key] = nestedDefaults;
      }
    }
  }
  return defaults;
}

exports.checkIfFieldIsRequired = checkIfFieldIsRequired;
exports.extractDefault = extractDefault;
exports.getPrimitiveType = getPrimitiveType;
exports.getSchemaDefaults = getSchemaDefaults;
exports.getUnwrappedType = getUnwrappedType;
exports.removeDefault = removeDefault;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map