import { useEffect } from "react";
import SuperTokens from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";

let frontendInitialized = false;

// Only reset-password related keys live here.
const RESET_PASSWORD_TRANSLATIONS_PL: Record<string, string> = {
  EMAIL_PASSWORD_EMAIL_LABEL: "Email",
  EMAIL_PASSWORD_EMAIL_PLACEHOLDER: "Wpisz email",
  EMAIL_PASSWORD_RESET_HEADER_TITLE: "Zresetuj hasło",
  EMAIL_PASSWORD_RESET_HEADER_SUBTITLE: "Wyślemy Ci email z linkiem do resetu hasła.",
  EMAIL_PASSWORD_RESET_SEND_FALLBACK_EMAIL:
    "Jeśli nie widzisz wiadomości, sprawdź spam lub spróbuj ponownie za chwilę.",
  EMAIL_PASSWORD_RESET_SEND_BEFORE_EMAIL: "Wysłaliśmy email resetujący hasło na adres ",
  EMAIL_PASSWORD_RESET_SEND_AFTER_EMAIL: ", jeśli istnieje w naszym systemie. ",
  EMAIL_PASSWORD_RESET_RESEND_LINK: "Wyślij ponownie lub zmień email",
  EMAIL_PASSWORD_RESET_SEND_BTN: "Wyślij email",
  EMAIL_PASSWORD_RESET_SIGN_IN_LINK: "Zaloguj się",
  EMAIL_PASSWORD_RESET_SUBMIT_PW_SUCCESS_HEADER_TITLE: "Hasło zmienione",
  EMAIL_PASSWORD_RESET_SUBMIT_PW_SUCCESS_DESC: "Możesz teraz zalogować się nowym hasłem.",
  EMAIL_PASSWORD_RESET_SUBMIT_PW_SUCCESS_SIGN_IN_BTN: "Przejdź do logowania",
  EMAIL_PASSWORD_NEW_PASSWORD_LABEL: "Nowe hasło",
  EMAIL_PASSWORD_NEW_PASSWORD_PLACEHOLDER: "Wpisz nowe hasło",
  EMAIL_PASSWORD_CONFIRM_PASSWORD_LABEL: "Powtórz hasło",
  EMAIL_PASSWORD_CONFIRM_PASSWORD_PLACEHOLDER: "Wpisz ponownie hasło",
  EMAIL_PASSWORD_RESET_SUBMIT_PW_HEADER_TITLE: "Ustaw nowe hasło",
  EMAIL_PASSWORD_RESET_SUBMIT_PW_HEADER_SUBTITLE: "Wpisz i potwierdź nowe hasło.",
  EMAIL_PASSWORD_RESET_SUBMIT_PW_CHANGE_PW_BTN: "Zmień hasło",
  EMAIL_PASSWORD_RESET_PASSWORD_INVALID_TOKEN_ERROR: "Link do resetu hasła jest nieprawidłowy lub wygasł",
  // Generic errors used by reset forms:
  ERROR_EMAIL_NON_STRING: "Email musi być tekstem",
  ERROR_EMAIL_INVALID: "Nieprawidłowy email",
  ERROR_PASSWORD_NON_STRING: "Hasło musi być tekstem",
  ERROR_PASSWORD_TOO_SHORT: "Hasło jest za krótkie",
  ERROR_PASSWORD_TOO_LONG: "Hasło jest za długie",
  ERROR_PASSWORD_NO_ALPHA: "Hasło musi zawierać przynajmniej jedną literę",
  ERROR_PASSWORD_NO_NUM: "Hasło musi zawierać przynajmniej jedną cyfrę",
  ERROR_CONFIRM_PASSWORD_NO_MATCH: "Hasła nie są takie same",
  ERROR_NON_OPTIONAL: "To pole jest wymagane",
  SOMETHING_WENT_WRONG_ERROR: "Coś poszło nie tak. Spróbuj ponownie.",
  SOMETHING_WENT_WRONG_ERROR_RELOAD: "Odśwież stronę",
  "Field is not optional": "To pole jest wymagane",
  "Email is invalid": "Nieprawidłowy email",
  "Password must contain at least 8 characters, including a number":
    "Hasło musi mieć minimum 8 znaków i zawierać cyfrę",
  "Password's length must be lesser than 100 characters": "Hasło musi mieć mniej niż 100 znaków",
  "Password must contain at least one alphabet": "Hasło musi zawierać przynajmniej jedną literę",
  "Password must contain at least one number": "Hasło musi zawierać przynajmniej jedną cyfrę",
};

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
    languageTranslations: {
      defaultLanguage: "en",
      // Force 100% PL for reset-password UI by overriding both `en` and `pl`.
      translations: {
        en: RESET_PASSWORD_TRANSLATIONS_PL,
        pl: RESET_PASSWORD_TRANSLATIONS_PL,
      },
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
