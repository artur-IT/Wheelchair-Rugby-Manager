import SuperTokens from "supertokens-web-js";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import Session from "supertokens-web-js/recipe/session";
import ThirdParty from "supertokens-web-js/recipe/thirdparty";

let frontendInitialized = false;

/**
 * Initialise SuperTokens on the browser (safe to call multiple times).
 */
export function ensureSuperTokensFrontendInitialized(): void {
  if (typeof window === "undefined" || frontendInitialized) {
    return;
  }
  frontendInitialized = true;

  const apiDomain = window.location.origin;

  SuperTokens.init({
    appInfo: {
      appName: "Wheelchair Rugby Manager",
      apiDomain,
      apiBasePath: "/api/auth",
    },
    recipeList: [EmailPassword.init(), ThirdParty.init(), Session.init()],
  });
}
