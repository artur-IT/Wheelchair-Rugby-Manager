import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete("session", { path: "/" });
  cookies.delete("sessionUserId", { path: "/" });
  cookies.delete("sessionUserRole", { path: "/" });
  return redirect("/");
};
