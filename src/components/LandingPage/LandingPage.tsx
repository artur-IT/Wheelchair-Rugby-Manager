import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { motion } from "motion/react";
import { Button, Grid, Card, CardContent, Box, Typography } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import LoginModal from "@/components/LoginModal/LoginModal";

const FEATURES = [
  {
    title: "Turnieje",
    desc: "Pełna kontrola nad harmonogramem, halami i zakwaterowaniem.",
  },
  {
    title: "Drużyny",
    desc: "Zarządzaj składami, trenerami i personelem pomocniczym.",
  },
  {
    title: "Personel",
    desc: "Koordynuj pracę sędziów, klasyfikatorów i wolontariuszy.",
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
} as const;

const CTA_BUTTON_SX = {
  backgroundColor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 700,
  px: 4,
  py: 2,
  "&:hover": { backgroundColor: "warning.main" },
} as const;

const FOOTER_SX = {
  p: 4,
  textAlign: "center",
  color: "text.secondary",
  fontSize: "0.875rem",
} as const;

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
            <Trophy color="#FE9A00" size={32} />
            <Typography variant="h5" sx={{ letterSpacing: "-0.05em" }}>
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
                mb: 3,
                lineHeight: 1.1,
                fontSize: { xs: "3rem", md: "4.5rem" },
              }}
            >
              Zarządzaj Sezonem <br />
              <Box component="span" sx={{ color: "primary.main" }}>
                Rugby na Wózkach
              </Box>
            </Typography>
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "1.25rem",
                maxWidth: "42rem",
                mx: "auto",
                mb: 5,
              }}
            >
              Kompleksowe narzędzie dla organizatorów. Planuj turnieje, zarządzaj drużynami, sędziami i wolontariuszami
              w jednym miejscu.
            </Typography>
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
                      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography sx={{ color: "text.secondary" }}>{feature.desc}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        <Box component="footer" sx={FOOTER_SX}>
          &copy; 2024 RugbyManager. Wszystkie prawa zastrzeżone.
        </Box>
      </Box>
    </ThemeRegistry>
  );
}
