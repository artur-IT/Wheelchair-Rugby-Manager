import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MutationErrorAlert from "./MutationErrorAlert";

describe("MutationErrorAlert", () => {
  it("renders nothing when error is missing", () => {
    const { container } = render(<MutationErrorAlert error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders Error message", () => {
    render(<MutationErrorAlert error={new Error("Boom")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Boom");
  });

  it("renders fallback message for non-Error values", () => {
    render(<MutationErrorAlert error="bad" fallbackMessage="Fallback text" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Fallback text");
  });
});
