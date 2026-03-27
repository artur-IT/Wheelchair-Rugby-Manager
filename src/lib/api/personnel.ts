import {
  ApiValidationError,
  getErrorMessageFromResponse,
  httpStatusFallbackMessage,
  parseApiErrorBody,
  parseApiFieldErrors,
} from "@/lib/apiHttp";
import type { Person } from "@/types";

interface PersonnelPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

/** GET /api/referees?seasonId=… or /api/classifiers?seasonId=… */
export async function fetchPersonnelBySeason(
  apiEndpoint: string,
  seasonId: string,
  loadErrorFallback: string,
  signal?: AbortSignal
): Promise<Person[]> {
  const res = await fetch(`${apiEndpoint}?seasonId=${encodeURIComponent(seasonId)}`, { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, loadErrorFallback);
    throw new Error(msg);
  }
  return res.json() as Promise<Person[]>;
}

/** POST /api/referees or /api/classifiers or /api/coaches */
export async function createPersonnel(
  apiEndpoint: string,
  payload: PersonnelPayload & { seasonId: string }
): Promise<Person> {
  const res = await fetch(apiEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const raw = await res.json().catch(() => null);
    const fieldErrors = parseApiFieldErrors(raw) ?? undefined;
    const message = parseApiErrorBody(raw) ?? httpStatusFallbackMessage(res) ?? "Nie udało się zapisać osoby";
    if (fieldErrors) throw new ApiValidationError(message, fieldErrors);
    throw new Error(message);
  }
  return res.json() as Promise<Person>;
}

/** PATCH /api/referees/:id or /api/classifiers/:id */
export async function updatePersonnel(apiEndpoint: string, id: string, payload: PersonnelPayload): Promise<Person> {
  const res = await fetch(`${apiEndpoint}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zaktualizować osoby");
    throw new Error(msg);
  }
  return res.json() as Promise<Person>;
}

/** DELETE /api/referees/:id or /api/classifiers/:id */
export async function deletePersonnel(apiEndpoint: string, id: string): Promise<void> {
  const res = await fetch(`${apiEndpoint}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć osoby");
    throw new Error(msg);
  }
}
