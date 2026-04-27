import { getErrorMessageFromResponse } from "@/lib/apiHttp";

interface CurrentUserResponse {
  name: string;
}

/** GET /api/users/me -> logged-in user's display name. */
export async function fetchCurrentUserName(signal?: AbortSignal): Promise<string> {
  const res = await fetch("/api/users/me", { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać danych użytkownika");
    throw new Error(msg);
  }
  const body = (await res.json()) as CurrentUserResponse;
  if (!body.name || !body.name.trim()) {
    throw new Error("Nie udało się pobrać nazwy użytkownika");
  }
  return body.name.trim();
}
