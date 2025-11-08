import * as z from 'zod';

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
  if (field instanceof z.ZodDefault) {
    return field.unwrap();
  }
  if ("innerType" in field.def) {
    const inner = removeDefault(field.def.innerType);
    if (field instanceof z.ZodOptional) {
      return inner.optional();
    }
    if (field instanceof z.ZodNullable) {
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
  if (field instanceof z.ZodDefault) {
    const defaultValue = field._def.defaultValue;
    return typeof defaultValue === "function" ? defaultValue() : defaultValue;
  }
  if ("unwrap" in field && typeof field.unwrap === "function") {
    return extractDefault(field.unwrap());
  }
  return void 0;
}
function getUnwrappedType(field) {
  if (field instanceof z.ZodDefault) {
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
    if (unwrapped instanceof z.ZodObject) {
      const nestedDefaults = getSchemaDefaults(unwrapped);
      if (Object.keys(nestedDefaults).length > 0) {
        defaults[key] = nestedDefaults;
      }
    }
  }
  return defaults;
}

export { checkIfFieldIsRequired, extractDefault, getPrimitiveType, getSchemaDefaults, getUnwrappedType, removeDefault };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map