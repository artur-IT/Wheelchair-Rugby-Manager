import { useEffect } from "react";
import SuperTokens from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";

let frontendInitialized = false;

/**
 * Initialise SuperTokens Auth React on the browser (safe to call multiple times).
 * Keep it separate from `supertokens-web-js` init used by custom UI.
 */
export function ensureSuperTokensAuthReactInitialized(): void {
  if (typeof window === "undefined" || frontendInitialized) {
    return;
  }
  frontendInitialized = true;

  const origin = window.location.origin;

  SuperTokens.init({
    appInfo: {
      appName: "Wheelchair Rugby Manager",
      apiDomain: origin,
      apiBasePath: "/api/auth",
      websiteDomain: origin,
      websiteBasePath: "/auth",
    },
    // ThirdParty requires non-empty providers array; this init is mainly for EmailPassword pre-built UI.
    recipeList: [EmailPassword.init(), Session.init()],
  });
}

/**
 * Small helper hook for components that render pre-built UI widgets.
 */
export function useEnsureSuperTokensAuthReactInitialized(): void {
  useEffect(() => {
    ensureSuperTokensAuthReactInitialized();
  }, []);
}
