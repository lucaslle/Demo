import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, fetchJson } from "./http-client";

const schema = z.object({ value: z.number() });

const stubFetch = (implementation: typeof fetch) => {
  vi.stubGlobal("fetch", vi.fn(implementation));
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("renvoie les données validées par le schéma", async () => {
    stubFetch(async () => jsonResponse({ value: 42 }));

    await expect(fetchJson("https://exemple.test", schema)).resolves.toEqual({
      value: 42,
    });
  });

  it("signale une erreur HTTP avec son statut", async () => {
    stubFetch(async () => jsonResponse({}, 503));

    await expect(
      fetchJson("https://exemple.test", schema),
    ).rejects.toMatchObject({ kind: "http", status: 503 });
  });

  it("refuse une réponse qui ne respecte pas le schéma", async () => {
    stubFetch(async () => jsonResponse({ value: "pas un nombre" }));

    await expect(
      fetchJson("https://exemple.test", schema),
    ).rejects.toMatchObject({ kind: "invalid-data" });
  });

  it("refuse une réponse qui n'est pas du JSON", async () => {
    stubFetch(async () => new Response("<html></html>", { status: 200 }));

    await expect(
      fetchJson("https://exemple.test", schema),
    ).rejects.toMatchObject({ kind: "invalid-data" });
  });

  it("signale une erreur réseau", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(
      fetchJson("https://exemple.test", schema),
    ).rejects.toMatchObject({ kind: "network" });
  });

  it("abandonne la requête au-delà du délai imparti", async () => {
    stubFetch(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    await expect(
      fetchJson("https://exemple.test", schema, { timeoutInMs: 10 }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });

  it("laisse passer l'annulation demandée par l'appelant", async () => {
    stubFetch(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const controller = new AbortController();

    const request = fetchJson("https://exemple.test", schema, {
      signal: controller.signal,
    });
    controller.abort();

    const error: unknown = await request.catch((caught: unknown) => caught);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});
