import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

/** Tells the reset-password UI whether the browser has a session and if a mandatory reset is pending. */
export const GET: APIRoute = async ({ cookies }) => {
  const sessionOk = cookies.get("session")?.value === "ok";
  const userId = cookies.get("sessionUserId")?.value?.trim();
  if (!sessionOk || !userId) {
    return json({ loggedIn: false, mustResetPassword: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustResetPassword: true },
  });
  if (!user) {
    return json({ loggedIn: false, mustResetPassword: false });
  }

  return json({ loggedIn: true, mustResetPassword: user.mustResetPassword });
};
