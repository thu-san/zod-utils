/**
 * Extract the element type from an array or undefined
 */
export type PickArrayObject<TArray extends unknown[] | undefined> =
  NonNullable<TArray>[number];

/**
 * Simplify complex types for better IDE hints
 */
export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Make all properties optional and nullable
 * Useful for form input types where fields can be empty
 */
export type MakeOptionalAndNullable<T> = {
  [K in keyof T]?: T[K] | null;
};
