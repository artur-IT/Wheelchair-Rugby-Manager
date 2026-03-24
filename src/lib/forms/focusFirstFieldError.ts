import type { FieldErrors, FieldValues, Path, UseFormSetFocus } from "react-hook-form";

export function focusFirstFieldError<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  setFocus: UseFormSetFocus<TFieldValues>
) {
  const [firstErrorField] = Object.keys(errors) as Path<TFieldValues>[];
  if (!firstErrorField) return;
  void setFocus(firstErrorField);
}
