export type PickArrayObject<TArray extends unknown[] | undefined> =
  NonNullable<TArray>[number];

export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

export type MakeOptionalAndNullable<T> = {
  [K in keyof T]?: T[K] | null;
};
