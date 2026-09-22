/**
 * Forwards /api/* to the JapLearn backend on Render.
 *
 * Some mobile carriers cannot reach Render's addresses directly, while Vercel
 * is reachable everywhere. The app therefore calls https://portal.japlearn.com/api/...
 * and this function relays the request from Vercel's servers.
 *
 * The backend rate-limits per client IP. Every relayed request would otherwise
 * appear to come from Vercel, so the real client IP is passed along together
 * with a shared secret; the backend only trusts that IP when the secret matches.
 */
// Node provides process at runtime; declared here because @types/node is not installed.
declare const process: { env: Record<string, string | undefined> };

const BACKEND_URL = (process.env.JAPLEARN_BACKEND_URL || "https://japlearn2-0.onrender.com").replace(/\/+$/, "");
const PROXY_SECRET = process.env.JAPLEARN_PROXY_SECRET || "";

// Give a sleeping Render instance time to wake before giving up.
export const config = { maxDuration: 60 };

// Hop-by-hop and Vercel-specific headers that must not be forwarded.
const SKIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
  "x-japlearn-client-ip",
  "x-japlearn-proxy-secret",
]);

// Node's fetch has already decoded the body, so these would be wrong downstream.
const SKIP_RESPONSE_HEADERS = new Set(["content-encoding", "content-length", "transfer-encoding", "connection"]);

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "";
}

// vercel.json rewrites /api/<path> to /api/proxy?__jlpath=<path>. Plain (non-Next)
// Vercel projects do not support catch-all file names such as [...path].ts, which
// only ever matched single-segment addresses like /api/health.
const PATH_PARAM = "__jlpath";

export function backendTarget(requestUrl: string): string {
  const incoming = new URL(requestUrl);
  const rewrittenPath = incoming.searchParams.get(PATH_PARAM);
  incoming.searchParams.delete(PATH_PARAM);

  // Without the rewrite parameter, the function was called by its own address.
  const path = rewrittenPath !== null
    ? `/api/${rewrittenPath.replace(/^\/+/, "")}`
    : incoming.pathname;
  const query = incoming.searchParams.toString();
  return `${BACKEND_URL}${path}${query ? `?${query}` : ""}`;
}

async function relay(request: Request): Promise<Response> {
  const target = backendTarget(request.url);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const name = key.toLowerCase();
    if (SKIP_REQUEST_HEADERS.has(name) || name.startsWith("x-vercel-")) return;
    headers.set(key, value);
  });

  const ip = clientIp(request);
  if (PROXY_SECRET && ip) {
    headers.set("X-JapLearn-Client-IP", ip);
    headers.set("X-JapLearn-Proxy-Secret", PROXY_SECRET);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method.toUpperCase());

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch {
    return new Response(JSON.stringify({ error: "The JapLearn server could not be reached. Please try again." }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
  responseHeaders.set("Cache-Control", upstream.headers.get("cache-control") || "no-store");

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = relay;
export const POST = relay;
export const PUT = relay;
export const PATCH = relay;
export const DELETE = relay;
export const OPTIONS = relay;
export const HEAD = relay;
