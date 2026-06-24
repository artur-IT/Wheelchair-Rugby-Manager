import { useTheme } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppProviders from "@/components/AppProviders/AppProviders";

function Probe() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  return (
    <span>
      {theme.palette.primary.main}-{queryClient ? "query" : "no-query"}
    </span>
  );
}

describe("AppProviders", () => {
  it("provides MUI theme and TanStack Query to children", () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>
    );

    expect(screen.getByText("#FE9A00-query")).toBeInTheDocument();
  });
});
