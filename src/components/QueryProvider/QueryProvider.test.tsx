import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import QueryProvider from "./QueryProvider";

describe("QueryProvider", () => {
  it("renders children", () => {
    render(
      <QueryProvider>
        <span>child</span>
      </QueryProvider>
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
