import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useEditableRows } from "./useEditableRows";

interface TestRow {
  id: string;
  value: string;
}

describe("useEditableRows", () => {
  it("adds, updates and removes rows", () => {
    const { result } = renderHook(() => useEditableRows<TestRow>([{ id: "a", value: "one" }]));

    act(() => {
      result.current.addRow({ id: "b", value: "two" });
    });
    expect(result.current.rows).toEqual([
      { id: "a", value: "one" },
      { id: "b", value: "two" },
    ]);

    act(() => {
      result.current.updateRow("b", (row) => ({ ...row, value: "updated" }));
    });
    expect(result.current.rows).toEqual([
      { id: "a", value: "one" },
      { id: "b", value: "updated" },
    ]);

    act(() => {
      result.current.removeRow("a");
    });
    expect(result.current.rows).toEqual([{ id: "b", value: "updated" }]);
  });

  it("keeps rows unchanged when id does not exist", () => {
    const initialRows: TestRow[] = [{ id: "a", value: "one" }];
    const { result } = renderHook(() => useEditableRows<TestRow>(initialRows));

    act(() => {
      result.current.updateRow("missing", (row) => ({ ...row, value: "x" }));
      result.current.removeRow("missing");
    });

    expect(result.current.rows).toEqual(initialRows);
  });
});
