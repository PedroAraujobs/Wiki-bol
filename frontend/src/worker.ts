type WorkerEnv = {
  API_ORIGIN?: string;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

const PROXY_HEADER = "cloudflare-worker";

export function shouldProxyToApi(url: URL) {
  return (
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/oauth2/") ||
    url.pathname.startsWith("/login/oauth2/")
  );
}

function workerHealth() {
  return Response.json(
    { status: "ok", proxy: PROXY_HEADER },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function missingApiOrigin() {
  return Response.json(
    {
      status: "error",
      message: "API_ORIGIN is not configured.",
    },
    { status: 500 },
  );
}

function apiOriginFromEnv(env: WorkerEnv) {
  return env.API_ORIGIN?.trim() ?? "";
}

export function buildProxyRequest(request: Request, apiOrigin: string) {
  const apiUrl = new URL(apiOrigin);
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(request.url);
  targetUrl.protocol = apiUrl.protocol;
  targetUrl.hostname = apiUrl.hostname;
  targetUrl.port = apiUrl.port;

  const headers = new Headers(request.headers);
  headers.set("X-Forwarded-Host", sourceUrl.host);
  headers.set("X-Forwarded-Proto", sourceUrl.protocol.replace(":", ""));
  headers.set("Forwarded", `proto=${sourceUrl.protocol.replace(":", "")};host=${sourceUrl.host}`);

  return new Request(targetUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });
}

function withProxyHeader(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("X-Wiki-Bol-Proxy", PROXY_HEADER);
  headers.set("Cache-Control", "no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);

    if (url.pathname === "/__worker/health") {
      return workerHealth();
    }

    if (shouldProxyToApi(url)) {
      const apiOrigin = apiOriginFromEnv(env);

      if (!apiOrigin) {
        return missingApiOrigin();
      }

      return withProxyHeader(await fetch(buildProxyRequest(request, apiOrigin)));
    }

    return env.ASSETS.fetch(request);
  },
};
