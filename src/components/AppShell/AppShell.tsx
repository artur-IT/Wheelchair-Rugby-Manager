import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { LayoutDashboard, Trophy, Settings, Building2, LogOut, Menu, X, UserCircle } from "lucide-react";
import { signOut } from "supertokens-web-js/recipe/session";
import { ensureSuperTokensFrontendInitialized } from "@/lib/supertokens/initFrontend";
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
} from "@mui/material";
import type { ContainerProps } from "@mui/material/Container";
import type { Theme } from "@mui/material/styles";

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
  /** MUI Container maxWidth; default "lg". Wider values give more room for fixed-width multi-column layouts. */
  containerMaxWidth?: ContainerProps["maxWidth"];
}

const MENU_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tournaments", icon: Trophy, label: "Turnieje" },
  { href: "/club", icon: Building2, label: "Mój Klub Sportowy" },
  { href: "/settings", icon: Settings, label: "Ustawienia Sezonu" },
];

const DRAWER_WIDTH = 280;
const APP_TITLE = "Wheelchair Rugby Manager";

const isPathActive = (currentPath: string, path: string) =>
  currentPath === path || (path !== "/" && currentPath.startsWith(path));

const SELECTED_ITEM_SX = {
  borderRadius: 1.5,
  mb: 1,
  "&.Mui-selected": {
    backgroundColor: "primary.main",
    color: "white",
    "&:hover": { backgroundColor: "primary.dark" },
  },
};

function NavigationItem({
  href,
  label,
  icon,
  selected,
  onClick,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <ListItem disablePadding>
      <ListItemButton component="a" href={href} selected={selected} onClick={onClick} sx={SELECTED_ITEM_SX}>
        <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>{icon}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  );
}

function DrawerContent({
  currentPath,
  onCloseMobile,
  onLogout,
}: {
  currentPath: string;
  onCloseMobile: () => void;
  onLogout: () => Promise<void>;
}) {
  return (
    <Box sx={{ width: "100%", p: 2, display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
            <Trophy size={24} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
            {APP_TITLE}
          </Typography>
        </Box>

        <List sx={{ mb: 3 }}>
          {MENU_ITEMS.map(({ href, icon: Icon, label }) => (
            <NavigationItem
              key={href}
              href={href}
              label={label}
              icon={<Icon size={20} />}
              selected={isPathActive(currentPath, href)}
              onClick={onCloseMobile}
            />
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <List>
          <NavigationItem
            href="/profile"
            label="Mój Profil"
            icon={<UserCircle size={20} />}
            selected={isPathActive(currentPath, "/profile")}
            onClick={onCloseMobile}
          />

          <ListItem disablePadding>
            <ListItemButton onClick={() => void onLogout()} sx={{ borderRadius: 1.5, color: "error.main" }}>
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText primary="Wyloguj" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          mt: "auto",
        }}
      >
        v.2.0
      </Typography>
    </Box>
  );
}

export default function AppShell({ children, currentPath, containerMaxWidth = "lg" }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobileDrawer = () => setMobileOpen(false);
  const toggleMobileDrawer = () => setMobileOpen((prev) => !prev);

  useEffect(() => {
    ensureSuperTokensFrontendInitialized();
  }, []);

  const handleLogout = async () => {
    ensureSuperTokensFrontendInitialized();
    await signOut();
    window.location.href = "/";
  };

  /** Tighter but non-zero side padding on club page (mobile portrait) so content still breathes. */
  const clubMobilePortraitCompactHorizontalPaddingSx = (theme: Theme) =>
    currentPath === "/club"
      ? {
          [theme.breakpoints.down("md")]: {
            "@media (orientation: portrait)": {
              paddingLeft: theme.spacing(1),
              paddingRight: theme.spacing(1),
            },
          },
        }
      : {};

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            bgcolor: "background.paper",
          },
        }}
      >
        <DrawerContent currentPath={currentPath} onCloseMobile={closeMobileDrawer} onLogout={handleLogout} />
      </Drawer>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
        }}
      >
        <AppBar
          position="sticky"
          sx={{
            display: { xs: "block", md: "none" },
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <Trophy size={24} style={{ marginRight: 8 }} />
            <Typography variant="h6" sx={{ flex: 1, fontWeight: "bold" }}>
              {APP_TITLE}
            </Typography>
            <IconButton color="inherit" onClick={toggleMobileDrawer}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={closeMobileDrawer}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          <DrawerContent currentPath={currentPath} onCloseMobile={closeMobileDrawer} onLogout={handleLogout} />
        </Drawer>

        <Box
          component="main"
          sx={(theme) => ({
            flex: 1,
            p: { xs: 2, md: 3 },
            pt: { xs: 3, md: 2 },
            maxWidth: "100%",
            overflowX: "auto",
            ...clubMobilePortraitCompactHorizontalPaddingSx(theme),
          })}
        >
          <Container maxWidth={containerMaxWidth} sx={(theme) => clubMobilePortraitCompactHorizontalPaddingSx(theme)}>
            {children}
          </Container>
        </Box>
        <Typography variant="body2" sx={{ textAlign: "center", mt: 2 }}>
          v.2.0
        </Typography>
      </Box>
    </Box>
  );
}
