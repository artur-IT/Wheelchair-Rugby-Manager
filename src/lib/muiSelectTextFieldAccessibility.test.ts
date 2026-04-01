import { describe, expect, it } from "vitest";
import { muiSelectTextFieldAccessibilityProps } from "@/lib/muiSelectTextFieldAccessibility";

describe("muiSelectTextFieldAccessibilityProps", () => {
  it("sets TextField id and clears InputLabel htmlFor for non-native Select", () => {
    const id = "match-plan-weekday";
    const p = muiSelectTextFieldAccessibilityProps(id);
    expect(p.id).toBe(id);
    expect(p.slotProps.inputLabel.htmlFor).toBeUndefined();
  });
});
