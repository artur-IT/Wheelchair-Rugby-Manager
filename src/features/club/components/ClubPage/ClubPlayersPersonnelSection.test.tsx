import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import QueryProvider from "@/components/QueryProvider/QueryProvider";
import type { ClubPlayerDto } from "@/features/club/components/ClubPage/types";

import ClubPlayersPersonnelSection from "./ClubPlayersPersonnelSection";

function renderWithQuery(ui: ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

const samplePlayer: ClubPlayerDto = {
  id: "p1",
  firstName: "Jan",
  lastName: "Kowalski",
  classification: 1.0,
  speed: 1,
  technique: 5,
  number: 7,
  status: "ACTIVE",
  birthDate: "2010-03-15T00:00:00.000Z",
  contactEmail: "jan@example.com",
  contactPhone: "123456789",
  contactAddress: "Sportowa 1",
  contactPostalCode: "80-001",
  contactCity: "Gdańsk",
  contactMapUrl: "https://www.google.com/maps/search/?api=1&query=test",
};

describe("ClubPlayersPersonnelSection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("accordion summary shows name and classification; details after expand", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    renderWithQuery(
      <ClubPlayersPersonnelSection
        clubId="c1"
        players={[samplePlayer]}
        isLoading={false}
        loadError={null}
        onRetry={() => {}}
      />
    );

    const summaryBtn = screen.getByRole("button", { expanded: false });
    const inSummary = within(summaryBtn);
    expect(inSummary.getByText("Jan")).toBeInTheDocument();
    expect(inSummary.getByText("Kowalski")).toBeInTheDocument();
    expect(inSummary.getByText("1.0")).toBeInTheDocument();
    expect(inSummary.getByText(/Szybkość/)).toBeInTheDocument();
    expect(inSummary.getByText(/Technika/)).toBeInTheDocument();
    expect(inSummary.getAllByText("1", { exact: true })).toHaveLength(1);
    expect(inSummary.getByText("5")).toBeInTheDocument();

    fireEvent.click(summaryBtn);

    expect(screen.getByText("2010-03-15 (16 lat)")).toBeVisible();
    expect(screen.getByText("Sportowa 1, 80-001 Gdańsk")).toBeVisible();

    const mapLink = screen.getByRole("link", { name: /Mapa\s*->/i });
    expect(mapLink).toHaveAttribute("href", samplePlayer.contactMapUrl);
    expect(mapLink).toHaveAttribute("target", "_blank");
    expect(mapLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
