import crypto from "node:crypto";

export const SESSION_COOKIE = "fv_session";
export const OAUTH_STATE_COOKIE = "fv_oauth_state";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const STATE_MAX_AGE_SECONDS = 60 * 10;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  return crypto
    .createHmac("sha256", requiredEnv("SESSION_SECRET"))
    .update(value)
    .digest("base64url");
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createRandomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function createSignedSession(payload) {
  const sessionPayload = {
    ...payload,
    issuedAt: Date.now()
  };
  const encodedPayload = base64url(JSON.stringify(sessionPayload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readSignedSession(cookieValue) {
  if (!cookieValue || !cookieValue.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = cookieValue.split(".");
  const expectedSignature = sign(encodedPayload);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload.issuedAt || Date.now() - payload.issuedAt > SESSION_MAX_AGE_SECONDS * 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  };
}

export function clearSessionCookieOptions() {
  return {
    ...sessionCookieOptions(),
    maxAge: 0
  };
}

export function stateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: STATE_MAX_AGE_SECONDS
  };
}

export function clearStateCookieOptions() {
  return {
    ...stateCookieOptions(),
    maxAge: 0
  };
}
