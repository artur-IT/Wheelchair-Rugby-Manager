import { ResetPasswordUsingToken } from "supertokens-auth-react/recipe/emailpassword/prebuiltui";
import { ensureSuperTokensAuthReactInitialized } from "@/lib/supertokens/initFrontendAuthReact";

// Some SuperTokens methods can be called during module/component setup.
// Ensure init happens as early as possible on the client.
if (typeof window !== "undefined") {
  ensureSuperTokensAuthReactInitialized();
}

export default function ResetPasswordPage() {
  // Pre-built UI reads recipe instances during render, so init must happen synchronously.
  ensureSuperTokensAuthReactInitialized();
  return (
    <div>
      <ResetPasswordUsingToken />
    </div>
  );
}
