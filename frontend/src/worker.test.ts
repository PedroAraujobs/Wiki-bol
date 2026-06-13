import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { buildProxyRequest, shouldProxyToApi } from "./worker";

const env = {
  API_ORIGIN: "https://wiki-bol-api.onrender.com",
  ASSETS: {
    fetch: vi.fn().mockResolvedValue(new Response("asset")),
  },
};

describe("Cloudflare worker API proxy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    "https://wiki-bol.testpedrobot.workers.dev/api/users/me",
    "https://wiki-bol.testpedrobot.workers.dev/oauth2/authorization/google",
    "https://wiki-bol.testpedrobot.workers.dev/login/oauth2/code/google",
  ])("proxies %s to the Render API", (url) => {
    expect(shouldProxyToApi(new URL(url))).toBe(true);
  });

  it("keeps editorial frontend routes on static assets", () => {
    expect(shouldProxyToApi(new URL("https://wiki-bol.testpedrobot.workers.dev/pages/ao-ashi"))).toBe(false);
  });

  it("rewrites proxied requests to Render and preserves forwarded host metadata", () => {
    const original = new Request("https://wiki-bol.testpedrobot.workers.dev:8787/api/users/me?source=test", {
      headers: {
        Accept: "application/json",
      },
    });

    const proxied = buildProxyRequest(original, env.API_ORIGIN);

    expect(proxied.url).toBe("https://wiki-bol-api.onrender.com/api/users/me?source=test");
    expect(proxied.headers.get("Accept")).toBe("application/json");
    expect(proxied.headers.get("X-Forwarded-Host")).toBe("wiki-bol.testpedrobot.workers.dev:8787");
    expect(proxied.headers.get("X-Forwarded-Proto")).toBe("https");
    expect(proxied.headers.get("Forwarded")).toBe("proto=https;host=wiki-bol.testpedrobot.workers.dev:8787");
  });

  it("serves a worker healthcheck without hitting assets or Render", async () => {
    const response = await worker.fetch(new Request("https://wiki-bol.testpedrobot.workers.dev/__worker/health"), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ok", proxy: "cloudflare-worker" });
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("adds a diagnostic header to proxied responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await worker.fetch(new Request("https://wiki-bol.testpedrobot.workers.dev/api/users/me"), env);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(response.headers.get("X-Wiki-Bol-Proxy")).toBe("cloudflare-worker");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
