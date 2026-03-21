import { getErrorMessageFromResponse } from "@/lib/apiHttp";
import type { Person } from "@/types";

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
