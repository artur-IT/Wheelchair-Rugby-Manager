import { getErrorMessageFromResponse } from "@/lib/apiHttp";

export interface CurrentUserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateCurrentUserProfileBody {
  firstName: string;
  lastName: string;
}

/** GET /api/users/me -> logged-in user's display name. */
export async function fetchCurrentUserName(signal?: AbortSignal): Promise<string> {
  const profile = await fetchCurrentUserProfile(signal);
  return `${profile.firstName} ${profile.lastName}`.trim();
}

/** GET /api/users/me -> logged-in user's profile fields. */
export async function fetchCurrentUserProfile(signal?: AbortSignal): Promise<CurrentUserProfile> {
  const res = await fetch("/api/users/me", { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać danych użytkownika");
    throw new Error(msg);
  }

  const body = (await res.json()) as CurrentUserProfile;
  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  // Allow empty first/last name on initial profile load.
  // Existing users may still have legacy `name` values that don't split cleanly.
  if (!email) {
    throw new Error("Nie udało się pobrać danych użytkownika");
  }

  return { firstName, lastName, email };
}

/** PUT /api/users/me -> update logged-in user's first and last name. */
export async function updateCurrentUserProfile(body: UpdateCurrentUserProfileBody): Promise<CurrentUserProfile> {
  const res = await fetch("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zapisać danych użytkownika");
    throw new Error(msg);
  }

  const updated = (await res.json()) as CurrentUserProfile;
  const firstName = updated.firstName?.trim() ?? "";
  const lastName = updated.lastName?.trim() ?? "";
  const email = updated.email?.trim() ?? "";
  if (!firstName || !lastName || !email) {
    throw new Error("Nie udało się zapisać danych użytkownika");
  }

  return { firstName, lastName, email };
}
