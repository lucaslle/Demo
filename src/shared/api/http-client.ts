import type { ZodType } from "zod";

export type ApiErrorKind = "network" | "timeout" | "http" | "invalid-data";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(
    kind: ApiErrorKind,
    message: string,
    status: number | null = null,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_IN_MS = 15_000;

type FetchJsonOptions = {
  signal?: AbortSignal;
  timeoutInMs?: number;
};

export const fetchJson = async <Data>(
  url: string,
  schema: ZodType<Data>,
  { signal, timeoutInMs = DEFAULT_TIMEOUT_IN_MS }: FetchJsonOptions = {},
): Promise<Data> => {
  const controller = new AbortController();
  let hasTimedOut = false;

  const timer = setTimeout(() => {
    hasTimedOut = true;
    controller.abort();
  }, timeoutInMs);

  const forwardAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", forwardAbort, { once: true });
  if (signal?.aborted) {
    forwardAbort();
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new ApiError(
        "http",
        `Le service a répondu avec le statut ${response.status}`,
        response.status,
      );
    }

    const json = await readJson(response);
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      throw new ApiError(
        "invalid-data",
        "Les données reçues ne respectent pas le format attendu",
        null,
        parsed.error,
      );
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (hasTimedOut) {
      throw new ApiError(
        "timeout",
        "Le service met trop de temps à répondre",
        null,
        error,
      );
    }
    if (signal?.aborted) {
      throw error;
    }
    throw new ApiError(
      "network",
      "Impossible de joindre le service",
      null,
      error,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
};

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch (error) {
    throw new ApiError(
      "invalid-data",
      "La réponse du service n'est pas un JSON valide",
      null,
      error,
    );
  }
};
