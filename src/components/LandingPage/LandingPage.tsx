import { useState, useEffect } from "react";
import { Trophy, CalendarDays, Medal, Users, UserCog, Building2, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { Button, Grid, Card, CardContent, Box, Typography } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import LoginModal from "@/components/LoginModal/LoginModal";
import { getYear } from "date-fns";

const FEATURES = [
  {
    title: "Sezon",
    desc: [
      "Ogranicz chaos organizacyjny i działaj szybciej",
      "Stwórz sezon na nowy rok i łatwo organizuj kolejne turnieje",
      "W sezonie dodajesz drużyny, Sędziów i Klasyfikatorów tylko raz",
      "Przeglądaj wcześniejsze sezony i porównuj dane",
    ],
  },
  {
    title: "Turnieje",
    desc: [
      "Informacje o halach i noclegach w jednym miejscu",
      "Automatyczne linki do Map Google",
      "Ułóż terminarz meczów i trzymaj wszystko pod kontrolą",
      "Drukuj harmonogram meczów dla Zawodników",
      "Specjalny harmonogram dla Sędziów",
      "Klasyfikatorzy też mają swój harmonogram badań",
    ],
  },
  {
    title: "Drużyny",
    desc: [
      "Twórz przejrzyste składy zespołów",
      "Dodawaj Zawodników i Staff",
      "Sprawnie aktualizuj składy i dane kontaktowe",
      "Komplet informacji zawsze pod ręką",
    ],
  },
  {
    title: "Personel",
    desc: [
      "Wpisz dane Sędziów, Klasyfikatorów i Wolontariuszy, aby łatwo się skontaktować",
      "Przydzielaj zadania personelowi w jasny i uporządkowany sposób",
      "Wprowadzasz dane 1 raz a potem tylko klikasz przydzielając zadania na turnieju",
    ],
  },
  {
    title: "Klub Sportowy",
    desc: [
      "Zarządzaj własnym Klubem",
      "Klub ma kilka drużyń? Stwórz je",
      "Sprawnie aktualizuj składy swoich drużyn",
      "Każdy zawodnik ma profil z danymi kontaktowymi i umiejętnościami!",
      "Zarządzaj personelem klubu - Zawodnicy, Trenerzy, Staff, Wolontariusze",
      "Miej komplet informacji gotowy zawsze, gdy go potrzebujesz",
    ],
  },
];

const PAGE_SX = {
  minHeight: "100vh",
  bgcolor: "background.default",
  color: "text.primary",
  display: "flex",
  flexDirection: "column",
} as const;

const NAV_SX = {
  p: 3,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: "80rem",
  mx: "auto",
  width: "100%",
} as const;

const HERO_SX = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  px: 3,
  textAlign: "center",
} as const;

const FEATURE_CARD_SX = {
  bgcolor: "background.paper",
  color: "text.secondary",
  borderRadius: "16px",
  border: "1px solid",
  borderColor: "divider",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-6px) scale(1.02)",
    boxShadow: 4,
    border: "1px solid",
  },
} as const;

const CTA_BUTTON_SX = {
  backgroundColor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 700,
  px: 4,
  py: 2,
  "&:hover": { backgroundColor: "warning.main", color: "white" },
} as const;

const FOOTER_SX = {
  mt: 6,
  p: 4,
  textAlign: "center",
  color: "text.secondary",
  fontSize: "0.875rem",
} as const;

const FEATURE_ICONS: Record<string, LucideIcon> = {
  Sezon: CalendarDays,
  Turnieje: Medal,
  Drużyny: Users,
  Personel: UserCog,
  "Klub Sportowy": Building2,
};

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("login")) openLogin();
  }, []);

  return (
    <ThemeRegistry>
      <LoginModal open={loginOpen} onClose={closeLogin} />
      <Box sx={PAGE_SX}>
        <Box component="nav" sx={NAV_SX}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <motion.div
              style={{ display: "inline-flex" }}
              whileHover={{ rotate: [0, 8, -8, 4, -4, 0], scale: 1.06 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
            >
              <Trophy color="#FE9A00" size={32} />
            </motion.div>
            <Typography variant="h6" sx={{ letterSpacing: "-0.05em" }}>
              Wheelchair Rugby Manager
            </Typography>
          </Box>
          <Button variant="contained" onClick={openLogin}>
            Zaloguj się
          </Button>
        </Box>

        <Box sx={HERO_SX}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mt: 5,
                mb: 5,
                lineHeight: 1.3,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Zarządzaj Turniejami <br />
              <Box component="span" sx={{ color: "primary.main" }}>
                Rugby na Wózkach
              </Box>
            </Typography>
            <Box
              sx={{
                color: "text.secondary",
                fontSize: "1rem",
                maxWidth: "42rem",
                mx: "auto",
                mb: 5,
                "& .MuiTypography-root": {
                  lineHeight: 1.7,
                },
              }}
            >
              <Typography component="p">
                Kompleksowe narzędzie{" "}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  dla Organizatorów Turniejów i Trenerów
                </Box>
                .
              </Typography>
              <Typography component="p">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Planuj i organizuj turnieje
                </Box>{" "}
                rugby na wózkach.
              </Typography>
              <Typography component="p">
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Zarządzaj Klubem Sportowym
                </Box>{" "}
                i swoimi drużynami.
              </Typography>
            </Box>
            <Button variant="contained" onClick={openLogin} sx={CTA_BUTTON_SX}>
              Rozpocznij teraz
            </Button>
          </motion.div>

          <Box sx={{ mt: 10, maxWidth: "72rem", width: "100%" }}>
            <Grid container spacing={3}>
              {FEATURES.map((feature) => (
                <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
                  <Card sx={FEATURE_CARD_SX}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1.25,
                          mt: 2,
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            color: "primary.main",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {(() => {
                            const Icon = FEATURE_ICONS[feature.title] ?? Trophy;
                            return <Icon size={20} />;
                          })()}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0 }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Box component="ul" sx={{ color: "text.secondary", m: 0, pl: 3, textAlign: "left" }}>
                        {feature.desc.map((item: string) => (
                          <Box component="li" key={item} sx={{ mb: 1.5 }}>
                            <Typography component="span" sx={{ color: "text.secondary" }}>
                              {item}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        <Box component="footer" sx={FOOTER_SX}>
          &copy; {getYear(new Date())} Wheelchair Rugby Manager. Wszystkie prawa zastrzeżone.
        </Box>
      </Box>
    </ThemeRegistry>
  );
}
