import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import type { ReactNode } from "react";
import "@fontsource/inter";

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    mode: "light",
    primary: {
      main: "#FE9A00",
      contrastText: "#4D4D4D",
    },
    secondary: {
      main: "#00A63E",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#4BA8DE",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#00A63E",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#E17100",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#D14343",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FAFAFA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#4D4D4D",
      secondary: "#717171",
    },
    divider: "#D4D4D4",
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 6px 18px rgba(144, 161, 185, 0.22)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 6px 18px rgba(144, 161, 185, 0.22)",
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "#4BA8DE",
          "&:hover": {
            color: "#90A1B9",
          },
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
