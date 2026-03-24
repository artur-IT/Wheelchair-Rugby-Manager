import { forwardRef, useState } from "react";
import { CardContent, Paper, Tab, Tabs, Typography, Box } from "@mui/material";
import type { TabProps } from "@mui/material";
import { UserCircle, Users } from "lucide-react";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import { CLASSIFIERS_CONFIG, REFEREES_CONFIG } from "@/features/settings/components/SettingsPage/SettingsPage.config";
import PersonnelTab from "@/features/settings/components/SettingsPage/PersonnelTab";
import SeasonsManager from "@/features/settings/components/SettingsPage/SeasonsManager";
import TeamsTab from "@/features/settings/components/SettingsPage/TeamsTab";
import type { TabValue } from "@/features/settings/components/SettingsPage/types";

const StyledTab = forwardRef<HTMLAnchorElement, TabProps>((props, ref) => (
  <Tab ref={ref} component="a" iconPosition="start" {...props} />
));

StyledTab.displayName = "StyledTab";

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<TabValue>("teams");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Ustawienia Sezonu
        </Typography>
        <Typography color="textSecondary">Zarządzaj globalnymi danymi ligi.</Typography>
      </Box>

      <SeasonsManager onSeasonChange={setSelectedSeasonId} />

      <Paper sx={{ borderRadius: 3 }}>
        <Tabs value={activeTab} onChange={(_, value: TabValue) => setActiveTab(value)} variant="fullWidth">
          <StyledTab label="Drużyny" value="teams" icon={<Users size={18} />} />
          <StyledTab label="Sędziowie" value="referees" icon={<UserCircle size={18} />} />
          <StyledTab label="Klasyfikatorzy" value="classifiers" icon={<UserCircle size={18} />} />
        </Tabs>

        <CardContent sx={{ minHeight: 400 }}>
          {activeTab === "teams" ? <TeamsTab seasonId={selectedSeasonId} /> : null}
          {activeTab === "referees" ? <PersonnelTab seasonId={selectedSeasonId} config={REFEREES_CONFIG} /> : null}
          {activeTab === "classifiers" ? (
            <PersonnelTab seasonId={selectedSeasonId} config={CLASSIFIERS_CONFIG} />
          ) : null}
        </CardContent>
      </Paper>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/settings">
          <SettingsContent />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}
