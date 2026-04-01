import { describe, expect, it } from "vitest";
import { printPageSizeCss } from "@/lib/print";

describe("printPageSizeCss", () => {
  it("returns A4 portrait for portrait orientation", () => {
    expect(printPageSizeCss("portrait")).toBe("A4 portrait");
  });

  it("returns A4 landscape for landscape orientation", () => {
    expect(printPageSizeCss("landscape")).toBe("A4 landscape");
  });
});
