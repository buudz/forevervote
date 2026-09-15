import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { pollCategories } from "../../../data/polls";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
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

function validateSubmission(body) {
  const title = clean(body?.title);
  const description = clean(body?.description);
  const category = clean(body?.category);
  const rawOptions = Array.isArray(body?.options) ? body.options : [];
  const options = rawOptions.map(clean);
  const allowMultipleAnswers = body?.allowMultipleAnswers === true;

  if (title.length < 10 || title.length > 180 || /[<>]/.test(title)) {
    return { error: "Title must be 10–180 characters and cannot contain < or >." };
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
    const submission = await submitPollDraft({
      creatorId: user.id,
      slug: slugify(validated.title),
      title: validated.title,
      description: validated.description,
      category: validated.category,
      options: validated.options,
      allowMultipleAnswers: validated.allowMultipleAnswers
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
    console.error("Poll submission failed", error.message);

    if (error.message?.includes("Too many poll submissions")) {
      return json({
        ok: false,
        error: "rate_limited",
        message: "You have submitted several polls recently. Please wait before sending another."
      }, 429);
    }

    return json({ ok: false, error: "submission_failed" }, 500);
  }
}
