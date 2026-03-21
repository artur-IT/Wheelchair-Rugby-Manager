import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useDefaultSeason } from "./useDefaultSeason";

describe("useDefaultSeason", () => {
  beforeEach(() => {
    localStorage.removeItem("defaultSeasonId");
  });

  afterEach(() => {
    localStorage.removeItem("defaultSeasonId");
  });

  it("syncs id from localStorage after mount", async () => {
    localStorage.setItem("defaultSeasonId", "season-1");

    const { result } = renderHook(() => useDefaultSeason());

    await waitFor(() => {
      expect(result.current.defaultSeasonId).toBe("season-1");
    });
  });

  it("saveDefault writes storage and updates state", () => {
    const { result } = renderHook(() => useDefaultSeason());

    act(() => {
      result.current.saveDefault("s-new");
    });

    expect(result.current.defaultSeasonId).toBe("s-new");
    expect(localStorage.getItem("defaultSeasonId")).toBe("s-new");
  });
});
