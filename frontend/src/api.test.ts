import { afterEach, describe, expect, it, vi } from "vitest";

describe("api client URLs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("normalizes a trailing slash in the API base URL before building the Google login URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://wiki-bol-api.onrender.com/");

    const { getGoogleLoginUrl } = await import("./api");

    expect(getGoogleLoginUrl()).toBe("https://wiki-bol-api.onrender.com/oauth2/authorization/google");
  });
});
