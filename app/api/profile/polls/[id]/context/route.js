import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../../../lib/auth/session";
import { addOwnPollContextUpdate } from "../../../../../lib/supabase/profile";

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function json(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function POST(request, context) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session?.user?.battlenetAccountId) {
    return json({ ok: false, error: "login_required" }, 401);
  }

  const { id } = await context.params;
  const bodyJson = await request.json().catch(() => null);
  const body = typeof bodyJson?.body === "string" ? bodyJson.body.trim() : "";

  if (body.length < 3 || body.length > 500 || /[<>]/.test(body)) {
    return json({
      ok: false,
      error: "invalid_context_update",
      message: "Context updates must be between 3 and 500 characters and cannot contain < or >."
    }, 400);
  }

  try {
    const update = await addOwnPollContextUpdate({
      session,
      pollId: id,
      body
    });

    return json({ ok: true, update }, 201);
  } catch (error) {
    const message = String(error?.message || "");

    if (error?.code === "42501" || message.includes("Only the poll creator")) {
      return json({
        ok: false,
        error: "not_owner",
        message: "Only the creator of this poll can post context updates."
      }, 403);
    }

    if (message.includes("live polls")) {
      return json({
        ok: false,
        error: "poll_not_live",
        message: "Context updates can only be added to live polls."
      }, 409);
    }

    if (message.includes("context update limit")) {
      return json({
        ok: false,
        error: "context_update_limit",
        message: "This poll has reached the maximum number of creator updates."
      }, 409);
    }

    if (error?.code === "23514") {
      return json({
        ok: false,
        error: "invalid_context_update",
        message: "That context update could not be saved."
      }, 400);
    }

    console.error("Creator context update failed", error.message);
    return json({
      ok: false,
      error: "context_update_failed",
      message: "Could not add the context update. Please try again."
    }, 500);
  }
}
