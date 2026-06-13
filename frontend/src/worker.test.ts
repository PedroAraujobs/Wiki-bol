import { describe, expect, it } from "vitest";
import { buildProxyRequest, shouldProxyToApi } from "./worker";

describe("Cloudflare worker API proxy", () => {
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

    const proxied = buildProxyRequest(original);

    expect(proxied.url).toBe("https://wiki-bol-api.onrender.com/api/users/me?source=test");
    expect(proxied.headers.get("Accept")).toBe("application/json");
    expect(proxied.headers.get("X-Forwarded-Host")).toBe("wiki-bol.testpedrobot.workers.dev:8787");
    expect(proxied.headers.get("X-Forwarded-Proto")).toBe("https");
  });
});
