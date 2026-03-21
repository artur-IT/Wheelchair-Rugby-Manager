import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataLoadAlert from "@/components/ui/DataLoadAlert";

describe("DataLoadAlert", () => {
  it("renders nothing when message is null", () => {
    const { container } = render(<DataLoadAlert message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows message and calls onRetry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<DataLoadAlert message="Błąd sieci" onRetry={onRetry} />);
    expect(screen.getByText("Błąd sieci")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
