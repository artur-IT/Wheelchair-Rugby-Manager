import SuperTokens from "supertokens-node";
import { buildRecipeList } from "@/lib/supertokens/recipeList";
import { getPublicSiteUrl, getSuperTokensApiKey, getSuperTokensConnectionUri } from "@/lib/supertokens/env";

let initialized = false;

/**
 * Initialise SuperTokens once per server process (safe across Astro hot reload if module resets).
 */
export function ensureSuperTokensInitialized(): void {
  if (initialized) {
    return;
  }

  const site = new URL(getPublicSiteUrl());

  SuperTokens.init({
    framework: "custom",
    supertokens: {
      connectionURI: getSuperTokensConnectionUri(),
      apiKey: getSuperTokensApiKey(),
    },
    appInfo: {
      appName: "Wheelchair Rugby Manager",
      apiDomain: site.origin,
      websiteDomain: site.origin,
      apiBasePath: "/api/auth",
      websiteBasePath: "/",
    },
    recipeList: buildRecipeList(),
  });

  // Only mark done after init succeeds — if init throws, the next request must retry.
  initialized = true;
}
