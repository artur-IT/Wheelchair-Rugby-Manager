import type { ZodType } from "zod";
import { json } from "@/lib/api";
import { getClubById } from "@/lib/club";
import { authorizeClubAccess } from "@/lib/clubAuth";

interface GuardOk<T> {
  ok: true;
  data: T;
  response?: undefined;
}

interface GuardFail {
  ok: false;
  data?: undefined;
  response: Response;
}

type GuardResult<T> = GuardOk<T> | GuardFail;

export const requiredId = (value: string | undefined, label: string): GuardResult<string> =>
  value ? ({ ok: true, data: value } as const) : ({ ok: false, response: json({ error: label }, 400) } as const);

export const requiredText = (value: string | null | undefined, label: string): GuardResult<string> =>
  value && value.trim().length > 0
    ? ({ ok: true, data: value.trim() } as const)
    : ({ ok: false, response: json({ error: label }, 400) } as const);

export const parseRequestJson = async (request: Request): Promise<GuardResult<Record<string, unknown>>> => {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false, response: json({ error: "Nieprawidłowy format JSON" }, 400) } as const;
    }
    return { ok: true, data: body as Record<string, unknown> } as const;
  } catch {
    return { ok: false, response: json({ error: "Nieprawidłowy format JSON" }, 400) } as const;
  }
};

export const parseWithSchema = <T>(schema: ZodType<T>, payload: unknown): GuardResult<T> => {
  const parsed = schema.safeParse(payload);
  return parsed.success
    ? ({ ok: true, data: parsed.data } as const)
    : ({ ok: false, response: json({ error: parsed.error.flatten() }, 400) } as const);
};

export const ensureClubExists = async (clubId: string): Promise<GuardResult<true>> => {
  const club = await getClubById(clubId);
  return club
    ? ({ ok: true, data: true } as const)
    : ({ ok: false, response: json({ error: "Nie znaleziono klubu" }, 404) } as const);
};

export const ensureClubAccess = async (request: Request, clubId: string): Promise<GuardResult<true>> => {
  const authz = await authorizeClubAccess(request, clubId);
  if (authz.ok === false) {
    return { ok: false, response: authz.response };
  }

  return { ok: true, data: true };
};

export const ensureEntityAccess = async <TEntity>(
  request: Request,
  entity: TEntity | null,
  getClubId: (item: TEntity) => string,
  notFoundMessage: string
): Promise<GuardResult<TEntity>> => {
  if (!entity) return { ok: false, response: json({ error: notFoundMessage }, 404) };

  const authz = await ensureClubAccess(request, getClubId(entity));
  if (!authz.ok) return { ok: false, response: authz.response };

  return { ok: true, data: entity };
};

export const mapPrismaError = (
  error: unknown,
  map: Partial<Record<"P2002" | "P2003", { message: string; status: number }>>
): Response | null => {
  const code =
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? ((error as { code: string }).code as "P2002" | "P2003")
      : null;
  if (!code) return null;
  const hit = map[code];
  return hit ? json({ error: hit.message }, hit.status) : null;
};
