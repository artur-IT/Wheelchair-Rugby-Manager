import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";

interface ClubDto {
  id: string;
  name: string;
  contactCity?: string | null;
  websiteUrl?: string | null;
  createdAt: string;
}

interface ClubCreatePayload {
  ownerUserId: string;
  name: string;
}

const fetchClubs = async (ownerUserId: string): Promise<ClubDto[]> => {
  const res = await fetch(`/api/club?ownerUserId=${encodeURIComponent(ownerUserId)}`);
  if (!res.ok) throw new Error("Nie udało się pobrać klubów");
  return res.json();
};

const createClub = async (payload: ClubCreatePayload): Promise<ClubDto> => {
  const res = await fetch("/api/club", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Nie udało się utworzyć klubu");
  return data;
};

function ClubPageContent() {
  const queryClient = useQueryClient();
  const [ownerUserId, setOwnerUserId] = useState("dev-owner-id");
  const [clubName, setClubName] = useState("");

  const clubsQuery = useQuery({
    queryKey: ["club", "list", ownerUserId],
    queryFn: () => fetchClubs(ownerUserId),
    enabled: ownerUserId.trim().length > 0,
  });

  const createClubMutation = useMutation({
    mutationFn: createClub,
    onSuccess: () => {
      setClubName("");
      return queryClient.invalidateQueries({ queryKey: ["club", "list", ownerUserId] });
    },
  });

  const sortedClubs = useMemo(
    () => [...(clubsQuery.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [clubsQuery.data]
  );

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Mój Klub Sportowy
        </Typography>
        <Typography color="text.secondary">Niezależny moduł do zarządzania klubem i personelem.</Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Header klubu (MVP)
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} gap={2}>
            <TextField
              label="Owner User Id"
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              fullWidth
            />
            <TextField label="Nazwa klubu" value={clubName} onChange={(e) => setClubName(e.target.value)} fullWidth />
            <Button
              variant="contained"
              disabled={!ownerUserId.trim() || !clubName.trim() || createClubMutation.isPending}
              onClick={() => createClubMutation.mutate({ ownerUserId: ownerUserId.trim(), name: clubName.trim() })}
            >
              Dodaj klub
            </Button>
          </Stack>
          {createClubMutation.error instanceof Error ? (
            <Typography color="error.main" sx={{ mt: 1.5 }}>
              {createClubMutation.error.message}
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Lista klubów
          </Typography>
          {clubsQuery.isPending ? <CircularProgress size={22} /> : null}
          {clubsQuery.error instanceof Error ? (
            <Typography color="error.main">{clubsQuery.error.message}</Typography>
          ) : null}
          {!clubsQuery.isPending && sortedClubs.length === 0 ? (
            <Typography color="text.secondary">Brak klubów dla podanego ownerUserId.</Typography>
          ) : null}
          <Stack gap={1.5}>
            {sortedClubs.map((club) => (
              <Card key={club.id} variant="outlined">
                <CardContent>
                  <Typography sx={{ fontWeight: 700 }}>{club.name}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {club.contactCity ?? "Brak miasta"} {club.websiteUrl ? `• ${club.websiteUrl}` : ""}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ClubPage() {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/club">
          <ClubPageContent />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}
