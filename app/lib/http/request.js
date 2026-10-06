export class RequestBodyError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = "RequestBodyError";
    this.code = code;
    this.status = status;
  }
}

export function isTrustedMutationRequest(request, { allowAuthorizationHeader = false } = {}) {
  if (allowAuthorizationHeader && request.headers.get("authorization")) {
    return true;
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === requestUrl.origin;
  }

  return request.headers.get("sec-fetch-site") === "same-origin";
}

export async function readJsonBody(request, { maxBytes = 16_384, fallback = null } = {}) {
  const declaredLength = Number(request.headers.get("content-length") || 0);

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyError("request_too_large", 413);
  }

  const rawBody = await request.text();
  const byteLength = new TextEncoder().encode(rawBody).byteLength;

  if (byteLength > maxBytes) {
    throw new RequestBodyError("request_too_large", 413);
  }

  if (!rawBody) {
    return fallback;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new RequestBodyError("invalid_json", 400);
  }
}
