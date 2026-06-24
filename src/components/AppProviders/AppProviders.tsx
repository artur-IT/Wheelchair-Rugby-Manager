import type { ReactNode } from "react";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";

interface AppProvidersProps {
  children: ReactNode;
}

/** Shared React context for Astro islands: TanStack Query + MUI theme. */
export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <ThemeRegistry>{children}</ThemeRegistry>
    </QueryProvider>
  );
}
