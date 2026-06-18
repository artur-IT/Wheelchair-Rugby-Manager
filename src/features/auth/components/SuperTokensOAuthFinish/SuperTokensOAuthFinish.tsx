import { useEffect, useState } from "react";
import { signInAndUp } from "supertokens-web-js/recipe/thirdparty";
import { ensureSuperTokensFrontendInitialized } from "@/lib/supertokens/initFrontend";

/**
 * Completes Google (third-party) login after redirect back to the site.
 */
export default function SuperTokensOAuthFinish() {
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      ensureSuperTokensFrontendInitialized();
      try {
        const result = await signInAndUp();
        if (cancelled) return;
        if (result.status === "OK") {
          window.location.replace("/dashboard");
          return;
        }
        if (result.status === "SIGN_IN_UP_NOT_ALLOWED") {
          setMessage(result.reason || "Ten e-mail jest już używany przez inne konto.");
          return;
        }
        setMessage("Sign-in with Google did not complete. Please try again.");
      } catch {
        if (!cancelled) setMessage("Something went wrong. Please try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <p>{message}</p>;
}
