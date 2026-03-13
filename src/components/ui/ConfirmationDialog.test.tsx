import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

describe("ConfirmationDialog", () => {
  it("renders title, description text and buttons", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmationDialog
        open
        title="Delete item"
        description="Are you sure?"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText("Delete item")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Anuluj" });
    await userEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);

    const confirmButton = screen.getByRole("button", { name: "Usuń" });
    await userEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("displays loading spinner+label, error message and custom content", () => {
    render(
      <ConfirmationDialog
        open
        title="Delete user"
        description={<p data-testid="custom-desc">Extra info</p>}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        loading
        errorMessage="Ops"
        confirmLabel="Remove"
        cancelLabel="Back"
      >
        <div>Child content</div>
      </ConfirmationDialog>
    );

    expect(screen.getByTestId("custom-desc")).toHaveTextContent("Extra info");
    expect(screen.getByText("Child content")).toBeInTheDocument();
    expect(screen.getByText("Ops")).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", { name: /Remove/i });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toContainElement(screen.getByRole("progressbar"));
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });
});
