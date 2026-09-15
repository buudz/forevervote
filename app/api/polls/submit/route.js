import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { pollCategories } from "../../../data/polls";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { isAdminSession } from "../../../lib/admin/access";
import { submitPollDraft } from "../../../lib/supabase/polls";
import { ensureUserFromSession } from "../../../lib/supabase/users";

const ALLOWED_CATEGORIES = pollCategories.filter((category) => category !== "All");
const MAX_BODY_LENGTH = 12000;

function json(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(title) {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54) || "community-poll";

  return `${base}-${crypto.randomBytes(4).toString("hex")}`;
}

function submissionFailure(error) {
  const message = String(error?.message || "");
  const details = String(error?.details || "");
  const combined = `${message} ${details}`.toLowerCase();

  if (error?.code === "RATE_LIMITED" || combined.includes("too many poll submissions")) {
    return {
      status: 429,
      error: "rate_limited",
      message: "You have submitted several polls recently. Please wait before sending another."
    };
  }

  if (combined.includes("title") && (combined.includes("90") || combined.includes("invalid poll title"))) {
    return {
      status: 400,
      error: "invalid_title",
      message: "The poll question must be between 10 and 90 characters."
    };
  }

  if (combined.includes("context") || combined.includes("description")) {
    if (combined.includes("1500") || combined.includes("invalid poll context") || combined.includes("invalid poll rationale")) {
      return {
        status: 400,
        error: "invalid_context",
        message: "Additional context must be 1500 characters or fewer."
      };
    }
  }

  if (combined.includes("poll option") || combined.includes("options must be unique")) {
    return {
      status: 400,
      error: "invalid_options",
      message: combined.includes("unique")
        ? "Poll options must all be different."
        : "Each poll option must be 1–100 characters."
    };
  }

  if (combined.includes("invalid poll category")) {
    return {
      status: 400,
      error: "invalid_category",
      message: "Choose a valid poll category."
    };
  }

  if (error?.code === "23505" || combined.includes("duplicate key")) {
    return {
      status: 409,
      error: "duplicate_submission",
      message: "That submission conflicts with an existing record. Please try submitting it again."
    };
  }

  if (
    error?.status === 401 ||
    error?.status === 403 ||
    error?.code === "42501" ||
    combined.includes("permission denied") ||
    combined.includes("row-level security")
  ) {
    return {
      status: 503,
      error: "submission_service_unavailable",
      message: "The submission service is temporarily unavailable. Please try again shortly."
    };
  }

  if (
    combined.includes("supabase is not configured") ||
    combined.includes("fetch failed") ||
    combined.includes("network") ||
    error?.status >= 500
  ) {
    return {
      status: 503,
      error: "submission_service_unavailable",
      message: "The submission service is temporarily unavailable. Please try again shortly."
    };
  }

  return {
    status: 500,
    error: "submission_failed",
    message: "The poll could not be submitted. Please try again. If it keeps happening, change nothing and report the error."
  };
}

function validateSubmission(body) {
  const title = clean(body?.title);
  const description = clean(body?.description);
  const category = clean(body?.category);
  const rawOptions = Array.isArray(body?.options) ? body.options : [];
  const options = rawOptions.map(clean);
  const allowMultipleAnswers = body?.allowMultipleAnswers === true;

  if (title.length < 10 || title.length > 90 || /[<>]/.test(title)) {
    return { error: "Title must be 10–90 characters and cannot contain < or >." };
  }

  if (description.length > 1500 || /[<>]/.test(description)) {
    return { error: "Optional context can be up to 1500 characters and cannot contain < or >." };
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return { error: "Choose a valid poll category." };
  }

  if (options.length < 2 || options.length > 20) {
    return { error: "Polls need between 2 and 20 options." };
  }

  if (options.some((option) => option.length < 1 || option.length > 100 || /[<>]/.test(option))) {
    return { error: "Each option must be 1–100 characters and cannot contain < or >." };
  }

  const uniqueOptions = new Set(options.map((option) => option.toLocaleLowerCase()));
  if (uniqueOptions.size !== options.length) {
    return { error: "Poll options must be unique." };
  }

  return { title, description, category, options, allowMultipleAnswers };
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session?.user?.battlenetAccountId) {
    return json({ ok: false, error: "login_required" }, 401);
  }

  if (!session?.wowProfile?.hasClassicProfile) {
    return json({ ok: false, error: "classic_profile_required" }, 403);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_LENGTH) {
    return json({ ok: false, error: "submission_too_large" }, 413);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const validated = validateSubmission(body);
  if (validated.error) {
    return json({ ok: false, error: "invalid_submission", message: validated.error }, 400);
  }

  try {
    const user = await ensureUserFromSession(session);
    const isAdmin = await isAdminSession(session);
    const submission = await submitPollDraft({
      creatorId: user.id,
      slug: slugify(validated.title),
      title: validated.title,
      description: validated.description,
      category: validated.category,
      options: validated.options,
      allowMultipleAnswers: validated.allowMultipleAnswers,
      bypassRateLimit: isAdmin
    });

    return json({
      ok: true,
      submission: {
        id: submission?.poll_id,
        slug: submission?.poll_slug,
        status: submission?.poll_status || "draft",
        createdAt: submission?.submitted_at
      }
    }, 201);
  } catch (error) {
    console.error("Poll submission failed", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      details: error?.details
    });

    const failure = submissionFailure(error);
    return json({
      ok: false,
      error: failure.error,
      message: failure.message
    }, failure.status);
  }
}
