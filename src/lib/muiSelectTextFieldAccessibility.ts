/**
 * MUI non-native Select puts the TextField `id` on a div[role=combobox]. Default InputLabel
 * uses htmlFor pointing at that div — not a valid <label for> target in HTML, so Chrome warns.
 * Clearing htmlFor is safe: SelectInput wires aria-labelledby to the label (labelId).
 * @see https://github.com/mui/material-ui/issues/38869
 */
export function muiSelectTextFieldAccessibilityProps(domId: string) {
  return {
    id: domId,
    slotProps: {
      inputLabel: {
        // Omit invalid label→div association; aria-labelledby handles a11y.
        htmlFor: undefined,
      },
    },
  };
}
