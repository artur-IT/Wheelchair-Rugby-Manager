import type { ComponentType } from "react";
import AppProviders from "@/components/AppProviders/AppProviders";

/** Wraps a page-level island with shared app providers (one export per Astro route). */
export function withAppProviders<P extends object>(Wrapped: ComponentType<P>): ComponentType<P> {
  function WithAppProviders(props: P) {
    return (
      <AppProviders>
        <Wrapped {...props} />
      </AppProviders>
    );
  }

  WithAppProviders.displayName = `withAppProviders(${Wrapped.displayName ?? Wrapped.name ?? "Component"})`;

  return WithAppProviders;
}
