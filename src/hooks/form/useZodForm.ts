import { zodResolver } from "@hookform/resolvers/zod";
import {
  type DefaultValues,
  type FieldValues,
  useForm,
  UseFormProps,
} from "react-hook-form";
import type * as z4 from "zod/v4/core";
import type { MakeOptionalAndNullable } from "@/types/util";
import { customErrorResolver } from "@/utils/zod";

export const FieldNamespaceMapping = {
  department: {
    groupName: "部署・店舗名",
  },
};

export type FIELD_NAMESPACE = keyof typeof FieldNamespaceMapping;

export const useZodForm = <T extends FieldValues>({
  schema,
  zodResolverOptions,
  ...formOptions
}: {
  schema: z4.$ZodType<T, MakeOptionalAndNullable<T>>;
  defaultValues?: DefaultValues<MakeOptionalAndNullable<T>>;
  zodResolverOptions?: Parameters<typeof zodResolver>[1];
} & Omit<
  UseFormProps<MakeOptionalAndNullable<T>, unknown, T>,
  "resolver" | "defaultValues"
>) => {
  const resolver = zodResolver(schema, zodResolverOptions);

  return useForm({
    resolver,
    ...formOptions,
  });
};
