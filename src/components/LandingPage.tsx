import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { motion } from "motion/react";
import { Button, Grid, Card, CardContent, Box, Typography } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry";
import LoginModal from "@/components/LoginModal";

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

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("login")) setLoginOpen(true);
  }, []);

  return (
    <ThemeRegistry>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#0f172a",
          color: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          component="nav"
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "80rem",
            mx: "auto",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Trophy color="#6366f1" size={32} />
            <Typography variant="h5" sx={{ letterSpacing: "-0.05em" }}>
              Wheelchair Rugby Manager
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => setLoginOpen(true)}>
            Zaloguj się
          </Button>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            textAlign: "center",
          }}
        >
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
              <Box component="span" sx={{ color: "#6366f1" }}>
                Rugby na Wózkach
              </Box>
            </Typography>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: "1.25rem",
                maxWidth: "42rem",
                mx: "auto",
                mb: 5,
              }}
            >
              Kompleksowe narzędzie dla organizatorów. Planuj turnieje, zarządzaj drużynami, sędziami i wolontariuszami
              w jednym miejscu.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setLoginOpen(true)}
              sx={{
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontWeight: 700,
                px: 4,
                py: 2,
                "&:hover": { backgroundColor: "#e2e8f0" },
              }}
            >
              Rozpocznij teraz
            </Button>
          </motion.div>

          <Box sx={{ mt: 10, maxWidth: "72rem", width: "100%" }}>
            <Grid container spacing={3}>
              {FEATURES.map((feature, i) => (
                <Grid size={{ xs: 12, md: 4 }} key={i}>
                  <Card
                    sx={{
                      bgcolor: "rgba(0, 16, 54, 0.6)",
                      color: "#cbd5e1",
                      borderRadius: "16px",
                      border: "1px solid #2563eb",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography sx={{ color: "#94a3b8" }}>{feature.desc}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        <Box
          component="footer"
          sx={{
            p: 4,
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.875rem",
          }}
        >
          &copy; 2024 RugbyManager. Wszystkie prawa zastrzeżone.
        </Box>
      </Box>
    </ThemeRegistry>
  );
}
