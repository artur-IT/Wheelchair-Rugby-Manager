import { Fragment, type ReactNode } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Link, Stack, Typography } from "@mui/material";
import { PLAYER_SKILL_FIELDS, STATUS_OPTIONS } from "@/features/club/components/ClubPage/ClubPlayerForm";
import { computeAgeFromIsoDateString } from "@/features/club/lib/clubPersonnelHelpers";
import type { ClubPlayerDto } from "@/features/club/components/ClubPage/types";
import { resolvePlaceMapsHref } from "@/lib/addressDisplay";
import { blurActiveElement } from "@/lib/a11y/blurActiveElement";

const PLAYER_LIST_TILE_WIDTH_PX = 310;

const statusLabel = (s: ClubPlayerDto["status"] | undefined) =>
  STATUS_OPTIONS.find((o) => o.value === (s ?? "ACTIVE"))?.label ?? s ?? "ACTIVE";

function playerBirthDisplay(birthDate: string | null | undefined): string {
  if (!birthDate?.trim()) return "—";
  const d = birthDate.slice(0, 10);
  const years = computeAgeFromIsoDateString(`${d}T12:00:00.000Z`);
  return years === null ? d : `${d} (${years} lat)`;
}

function playerAddressLine(p: ClubPlayerDto): string {
  const line1 = p.contactAddress?.trim();
  const cityLine = [p.contactPostalCode?.trim(), p.contactCity?.trim()].filter(Boolean).join(" ");
  const parts = [line1, cityLine].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function playerContactAddressForMaps(p: ClubPlayerDto): string {
  const line1 = p.contactAddress?.trim();
  const cityLine = [p.contactPostalCode?.trim(), p.contactCity?.trim()].filter(Boolean).join(" ");
  return [line1, cityLine].filter(Boolean).join(", ");
}

/** One decimal place for list rows (e.g. 2.0). */
function formatClassificationForList(c: number | null | undefined): string {
  if (c === null || c === undefined) return "—";
  const n = Number(c);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

const SKILL_RATING_COLOR_STOPS: readonly { pos: number; r: number; g: number; b: number }[] = [
  { pos: 1, r: 183, g: 28, b: 28 },
  { pos: 2, r: 230, g: 81, b: 0 },
  { pos: 3, r: 251, g: 192, b: 45 },
  { pos: 4, r: 139, g: 195, b: 74 },
  { pos: 5, r: 46, g: 125, b: 50 },
];

function skillRatingColor(rating: number): string {
  const x = Math.max(1, Math.min(5, rating));
  const stops = SKILL_RATING_COLOR_STOPS;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (!a || !b) break;
    if (x <= b.pos) {
      const t = (x - a.pos) / (b.pos - a.pos);
      const lerp = (u: number, v: number) => Math.round(u + (v - u) * t);
      return `rgb(${lerp(a.r, b.r)}, ${lerp(a.g, b.g)}, ${lerp(a.b, b.b)})`;
    }
  }
  const last = stops[stops.length - 1];
  if (last) return `rgb(${last.r}, ${last.g}, ${last.b})`;
  return "rgb(128, 128, 128)";
}

type PlayerSkillFieldName = (typeof PLAYER_SKILL_FIELDS)[number]["name"];

function playerSkillsPresent(p: ClubPlayerDto): { name: PlayerSkillFieldName; label: string; value: number }[] {
  return PLAYER_SKILL_FIELDS.flatMap(({ name, label }) => {
    const v = p[name];
    return typeof v === "number" && Number.isFinite(v) ? [{ name, label, value: v }] : [];
  });
}

/** Label + value block inside expanded accordion panel. */
function PlayerDetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0, mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Box>
  );
}

interface ClubPlayersListProps {
  players: ClubPlayerDto[];
  isDeletePending: boolean;
  deleteTargetId: string | null;
  onEditPlayer: (player: ClubPlayerDto) => void;
  onDeletePlayer: (player: ClubPlayerDto) => void;
}

export default function ClubPlayersList({
  players,
  isDeletePending,
  deleteTargetId,
  onEditPlayer,
  onDeletePlayer,
}: ClubPlayersListProps) {
  return (
    <Stack
      component="ul"
      direction="row"
      spacing={1}
      sx={{ listStyle: "none", m: 0, p: 0, alignItems: "flex-start", width: "100%" }}
    >
      {players.map((p) => {
        const shirt = p.number === null || p.number === undefined ? "—" : String(p.number);
        const classificationDisplay = formatClassificationForList(p.classification);
        const skillsRow = playerSkillsPresent(p);
        const mapsHref = resolvePlaceMapsHref({
          mapUrl: p.contactMapUrl ?? undefined,
          name: "",
          address: playerContactAddressForMaps(p),
        });
        return (
          <Accordion
            key={p.id}
            component="li"
            disableGutters
            elevation={0}
            sx={{
              width: PLAYER_LIST_TILE_WIDTH_PX,
              maxWidth: "100%",
              boxSizing: "border-box",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              listStyle: "none",
              overflow: "hidden",
              bgcolor: "background.paper",
              boxShadow: 1,
              flexShrink: 0,
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              component="div"
              expandIcon={<ExpandMoreIcon />}
              sx={{
                alignItems: "flex-start",
                px: 2,
                py: 1.5,
                "& .MuiAccordionSummary-content": {
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 1.25,
                  my: 0,
                },
                "& .MuiAccordionSummary-expandIconWrapper": {
                  alignSelf: "flex-start",
                  pt: 0.25,
                },
              }}
            >
              <Stack direction="row" spacing={{ xs: 1 }} sx={{ alignItems: "center" }}>
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {p.firstName}
                </Typography>
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {p.lastName}
                </Typography>
                <Typography component="span" variant="body2" color="text.secondary">
                  {classificationDisplay}
                </Typography>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  columnGap: 2,
                  rowGap: 0.75,
                  alignItems: "center",
                }}
              >
                {skillsRow.length ? (
                  skillsRow.map(({ name, label, value }) => (
                    <Fragment key={name}>
                      <Typography variant="body2" color="text.secondary" component="div" sx={{ minWidth: 0 }}>
                        {label}
                      </Typography>
                      <Box
                        component="span"
                        sx={(theme) => {
                          const bg = skillRatingColor(value);
                          return {
                            justifySelf: "end",
                            width: 26,
                            height: 26,
                            boxSizing: "border-box",
                            flexShrink: 0,
                            borderRadius: 0.5,
                            bgcolor: bg,
                            color: theme.palette.getContrastText(bg),
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            typography: "body2",
                            lineHeight: 1,
                          };
                        }}
                      >
                        {value}
                      </Box>
                    </Fragment>
                  ))
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic", gridColumn: "1 / -1" }}>
                    Brak ocenionych umiejętności
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={{ xs: 1 }} sx={{ pt: 0.25 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    blurActiveElement();
                    onEditPlayer(p);
                  }}
                >
                  Edytuj
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  disabled={isDeletePending && deleteTargetId === p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    blurActiveElement();
                    onDeletePlayer(p);
                  }}
                >
                  Usuń
                </Button>
              </Stack>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                px: 2,
                pb: 2,
                pt: 0,
                borderTop: 1,
                borderColor: "divider",
                bgcolor: (theme) => (theme.palette.mode === "dark" ? "action.hover" : theme.palette.grey[50]),
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 1.5,
                  pt: 2,
                }}
              >
                <PlayerDetailField label="Numer koszulki">{shirt}</PlayerDetailField>
                <PlayerDetailField label="Status">{statusLabel(p.status ?? "ACTIVE")}</PlayerDetailField>
                <PlayerDetailField label="Data urodzenia">{playerBirthDisplay(p.birthDate)}</PlayerDetailField>
                <PlayerDetailField label="Telefon">{p.contactPhone?.trim() || "—"}</PlayerDetailField>
                <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}>
                  <PlayerDetailField label="E-mail">{p.contactEmail?.trim() || "—"}</PlayerDetailField>
                </Box>
                <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}>
                  <PlayerDetailField label="Adres">{playerAddressLine(p)}</PlayerDetailField>
                </Box>
                {mapsHref ? (
                  <Link href={mapsHref} target="_blank" rel="noopener noreferrer">
                    {"Mapa ->"}
                  </Link>
                ) : (
                  "—"
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
