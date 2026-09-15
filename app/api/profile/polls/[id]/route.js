import { NextResponse } from "next/server";
import { readSignedSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { editOwnPoll } from "../../../../lib/supabase/profile";

const categories = ["PvE", "PvP", "World", "RolePlay", "Hardcore", "General"];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function validate(body) {
  const title = clean(body?.title);
  const description = clean(body?.description);
  const category = clean(body?.category);
  const options = Array.isArray(body?.options) ? body.options.map(clean) : [];

  if (title.length < 10 || title.length > 90 || /[<>]/.test(title)) {
    return { error: "invalid_title", message: "The poll question must be between 10 and 90 characters." };
  }

  if (description.length > 1500 || /[<>]/.test(description)) {
    return { error: "invalid_context", message: "Additional context must be 1500 characters or fewer." };
  }

  if (!categories.includes(category)) {
    return { error: "invalid_category", message: "Choose a valid poll category." };
  }

  if (options.length < 2 || options.length > 20) {
    return { error: "invalid_options", message: "Polls need between 2 and 20 options." };
  }

  if (options.some((option) => option.length < 1 || option.length > 100 || /[<>]/.test(option))) {
    return { error: "invalid_options", message: "Each poll option must be 1–100 characters and cannot contain < or >." };
  }

  if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== options.length) {
    return { error: "invalid_options", message: "Poll options must all be different." };
  }

  return {
    title,
    description,
    category,
    options,
    allowMultipleAnswers: body?.allowMultipleAnswers === true
  };
}

export async function PATCH(request, context) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const validated = validate(body);

  if (validated.error) {
    return NextResponse.json({ ok: false, error: validated.error, message: validated.message }, { status: 400 });
  }

  try {
    const poll = await editOwnPoll({
      session,
      pollId: id,
      ...validated
    });

    return NextResponse.json({ ok: true, poll }, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const message = String(error?.message || "");

    if (error?.code === "42501" || message.includes("Only the poll creator")) {
      return NextResponse.json({ ok: false, error: "not_owner", message: "You can only edit polls you created." }, { status: 403 });
    }

    if (message.includes("after voting has started")) {
      return NextResponse.json({ ok: false, error: "poll_locked", message: "This poll can no longer be edited because it already has votes." }, { status: 409 });
    }

    if (message.includes("can no longer be edited")) {
      return NextResponse.json({ ok: false, error: "poll_locked", message: "This poll can no longer be edited." }, { status: 409 });
    }

    console.error("Creator poll edit failed", error.message);
    return NextResponse.json({ ok: false, error: "edit_failed", message: "Could not save the poll changes." }, { status: 500 });
  }
}
