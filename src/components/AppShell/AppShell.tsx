import { useState } from "react";
import type { ReactNode } from "react";
import { LayoutDashboard, Trophy, Settings, LogOut, Menu, X, UserCircle } from "lucide-react";
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

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
}

const MENU_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tournaments", icon: Trophy, label: "Turnieje" },
  { href: "/settings", icon: Settings, label: "Ustawienia Sezonu" },
];

const DRAWER_WIDTH = 280;

export default function AppShell({ children, currentPath }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => currentPath === path || (path !== "/" && currentPath.startsWith(path));

  const selectedSx = {
    borderRadius: 1.5,
    mb: 1,
    "&.Mui-selected": {
      backgroundColor: "primary.main",
      color: "white",
      "&:hover": { backgroundColor: "primary.dark" },
    },
  };

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
          <Trophy size={24} />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Wheelchair Rugby
        </Typography>
      </Box>

      <List sx={{ mb: 3 }}>
        {MENU_ITEMS.map(({ href, icon: Icon, label }) => (
          <ListItem key={href} disablePadding>
            <ListItemButton
              component="a"
              href={href}
              onClick={() => setMobileOpen(false)}
              selected={isActive(href)}
              sx={selectedSx}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <List>
        <ListItem disablePadding>
          <ListItemButton
            component="a"
            href="/profile"
            onClick={() => setMobileOpen(false)}
            selected={isActive("/profile")}
            sx={selectedSx}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <UserCircle size={20} />
            </ListItemIcon>
            <ListItemText primary="Mój Profil" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/";
            }}
            sx={{ borderRadius: 1.5, color: "error.main" }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText primary="Wyloguj" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            bgcolor: "background.paper",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          width: "100%",
          ml: { md: `${DRAWER_WIDTH}px` },
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
              Wheelchair Rugby Manager
            </Typography>
            <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          {drawerContent}
        </Drawer>

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            pt: { xs: 3, md: 2 },
            maxWidth: "100%",
          }}
        >
          <Container maxWidth="lg">{children}</Container>
        </Box>
      </Box>
    </Box>
  );
}
