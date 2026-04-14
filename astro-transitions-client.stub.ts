import { vi } from "vitest";

/** Vitest stand-in for `astro:transitions/client` (see `vitest.config.ts` resolve.alias). */
export const navigate = vi.fn();
