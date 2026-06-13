const API_ORIGIN = "https://wiki-bol-api.onrender.com";

type WorkerEnv = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

export function shouldProxyToApi(url: URL) {
  return (
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/oauth2/") ||
    url.pathname.startsWith("/login/oauth2/")
  );
}

export function buildProxyRequest(request: Request) {
  const apiUrl = new URL(API_ORIGIN);
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(request.url);
  targetUrl.protocol = apiUrl.protocol;
  targetUrl.hostname = apiUrl.hostname;
  targetUrl.port = apiUrl.port;

  const headers = new Headers(request.headers);
  headers.set("X-Forwarded-Host", sourceUrl.host);
  headers.set("X-Forwarded-Proto", sourceUrl.protocol.replace(":", ""));

  return new Request(targetUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);

    if (shouldProxyToApi(url)) {
      return fetch(buildProxyRequest(request));
    }

    return env.ASSETS.fetch(request);
  },
};
