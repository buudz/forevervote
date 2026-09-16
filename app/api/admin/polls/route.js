import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "../../../lib/admin/access";
import { readSignedSession, SESSION_COOKIE } from "../../../lib/auth/session";
import {
  editPollAdmin,
  getAdminPollEditHistory,
  getAdminPollQueues,
  updatePollAdminState
} from "../../../lib/supabase/polls";

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

async function getAdmin(request) {
  const session = readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  const authorization = await authorizeAdminRequest(request, session);
  return { ...authorization, session };
}

export async function GET(request) {
  const admin = await getAdmin(request);

  if (!admin.ok) {
    return json({ ok: false, error: "admin_required" }, 403);
  }

  const historyPollId = request.nextUrl.searchParams.get("historyPollId");

  try {
    if (historyPollId) {
      const history = await getAdminPollEditHistory(historyPollId);
      return json({ ok: true, history });
    }

    const queues = await getAdminPollQueues();
    return json({ ok: true, ...queues });
  } catch (error) {
    console.error("Failed to load admin poll data", error.message);
    return json({ ok: false, error: "admin_polls_unavailable" }, 503);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const admin = await getAdmin(request);
  if (!admin.ok) {
    return json({ ok: false, error: "admin_required" }, 403);
  }

  const body = await request.json().catch(() => null);
  const pollId = typeof body?.pollId === "string" ? body.pollId : "";
  const action = body?.action;
  const allowedActions = ["publish", "reject", "unpublish", "restore", "edit"];

  if (!pollId || !allowedActions.includes(action)) {
    return json({ ok: false, error: "invalid_request" }, 400);
  }

  try {
    if (action === "edit") {
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      const rationale = typeof body?.rationale === "string" ? body.rationale.trim() : "";
      const allowMultipleAnswers = body?.allowMultipleAnswers === true;
      const options = Array.isArray(body?.options)
        ? body.options.map((option) => typeof option === "string" ? option.trim() : "")
        : [];

      if (title.length < 10 || title.length > 90 || /[<>]/.test(title)) {
        return json({ ok: false, error: "invalid_title" }, 400);
      }

      if (rationale.length > 1500 || /[<>]/.test(rationale)) {
        return json({ ok: false, error: "invalid_rationale" }, 400);
      }

      if (options.length < 2 || options.length > 20) {
        return json({ ok: false, error: "invalid_options" }, 400);
      }

      if (options.some((option) => option.length < 1 || option.length > 100 || /[<>]/.test(option))) {
        return json({ ok: false, error: "invalid_options" }, 400);
      }

      if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
        return json({ ok: false, error: "duplicate_options" }, 400);
      }

      const poll = await editPollAdmin({
        pollId,
        title,
        rationale,
        options,
        allowMultipleAnswers,
        editorBattleNetAccountId: admin.session?.user?.battlenetAccountId || null,
        editorBattleTag: admin.session?.user?.battletag || (admin.method === "bearer" ? "Admin API token" : "Admin")
      });

      return json({ ok: true, poll });
    }

    const poll = await updatePollAdminState({ pollId, action });
    return json({ ok: true, poll });
  } catch (error) {
    console.error("Poll admin action failed", error.message);
    return json({
      ok: false,
      error: error.status === 404
        ? "poll_not_found"
        : error.status === 410
          ? "trash_expired"
          : error.status === 409
            ? "poll_state_conflict"
            : error.code === "23514" && error.message?.includes("Voting mode cannot be changed after votes")
              ? "voting_mode_locked"
              : error.code === "23514" && error.message?.includes("Answer count cannot be changed after votes")
                ? "answer_count_locked"
                : error.code === "23514" && error.message?.includes("Poll options must be unique")
                  ? "duplicate_options"
                  : error.code === "23514" && error.message?.includes("option")
                    ? "invalid_options"
                    : error.code === "23514"
                      ? "invalid_poll_copy"
                : "admin_action_failed"
    }, error.status || 500);
  }
}
