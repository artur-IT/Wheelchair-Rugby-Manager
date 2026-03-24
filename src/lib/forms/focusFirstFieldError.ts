import type { FieldErrors, FieldValues, Path, UseFormSetFocus } from "react-hook-form";

export function focusFirstFieldError<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  setFocus: UseFormSetFocus<TFieldValues>
) {
  const findFirstErrorPath = (value: unknown, parentPath = ""): string | null => {
    if (!value || typeof value !== "object") return null;

    const errorNode = value as Record<string, unknown>;
    const isLeafError = "type" in errorNode || "message" in errorNode || "ref" in errorNode;
    if (isLeafError && parentPath) return parentPath;

    for (const key of Object.keys(errorNode)) {
      const nextPath = parentPath ? `${parentPath}.${key}` : key;
      const foundPath = findFirstErrorPath(errorNode[key], nextPath);
      if (foundPath) return foundPath;
    }

    return null;
  };

  const firstErrorField = findFirstErrorPath(errors) as Path<TFieldValues> | null;
  if (!firstErrorField) return;
  void setFocus(firstErrorField);
}
