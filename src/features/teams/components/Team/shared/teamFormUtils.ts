import type { Player } from "@/types";

export interface TeamPlayerPayload {
  id?: string;
  firstName: string;
  lastName: string;
  classification?: number;
  number?: number;
}

interface PlayerLike {
  id?: string;
  firstName: string;
  lastName: string;
  classification?: number | null;
  number?: number | null;
}

interface PlayerRowLike {
  id?: string;
  firstName: string;
  lastName: string;
  classification: string;
  number: string;
}

export const normalizeText = (value?: string | null) => value?.trim() ?? "";

export const parseOptionalNumber = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;
  const parsedValue = Number(trimmedValue.replace(",", "."));
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
};

export const buildPlayerPayload = (player: PlayerLike): TeamPlayerPayload => ({
  id: normalizeText(player.id) || undefined,
  firstName: player.firstName,
  lastName: player.lastName,
  classification: player.classification ?? undefined,
  number: player.number ?? undefined,
});

export const buildPlayerPayloadFromRow = (row: PlayerRowLike): TeamPlayerPayload => ({
  id: normalizeText(row.id) || undefined,
  firstName: normalizeText(row.firstName),
  lastName: normalizeText(row.lastName),
  classification: parseOptionalNumber(row.classification),
  number: parseOptionalNumber(row.number),
});

export const buildPlayerPayloadFromEntity = (player: Player): TeamPlayerPayload => buildPlayerPayload(player);

export const toWebsiteHref = (websiteUrl: string) => {
  if (!websiteUrl) return "";
  const lowerUrl = websiteUrl.toLowerCase();
  if (lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://") || websiteUrl.startsWith("//")) {
    return websiteUrl;
  }
  return `https://${websiteUrl}`;
};
