"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pollCategories } from "../data/polls";

const categories = pollCategories.filter((category) => category !== "All");
const PROFILE_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most votes" },
  { value: "az", label: "A–Z" }
];

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function statusLabel(poll) {
  if (poll.status === "draft") return "Waiting for admin approval";
  if (poll.status === "open") return "Approved · live";
  if (poll.trashReason === "rejected") return "Rejected";
  if (poll.trashReason === "unpublished") return "Unpublished";
  return poll.status || "Submitted";
}

function searchablePollText(poll) {
  return [
    poll.title,
    poll.category,
    statusLabel(poll),
    poll.rationale,
    ...(poll.contextUpdates || []).map((update) => update.body),
    ...(poll.options || []).map((option) => option.text),
    ...(poll.selectedOptionTexts || [])
  ].filter(Boolean).join(" ").toLocaleLowerCase();
}

function sortProfilePolls(polls, sort) {
  const list = [...polls];

  if (sort === "oldest") {
    return list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }

  if (sort === "popular") {
    return list.sort((a, b) => {
      const voteDifference = Number(b.totalVoters || 0) - Number(a.totalVoters || 0);
      if (voteDifference !== 0) return voteDifference;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }

  if (sort === "az") {
    return list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  }

  return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function PollRow({ poll, kind, onEdit, onContextUpdate }) {
  const linkable = poll.status === "open";
  const votes = Number(poll.totalVoters || 0);

  return <article className="profile-poll-card">
    <div className="profile-poll-meta">
      <span className="category">{poll.category}</span>
      <span>{statusLabel(poll)}</span>
      <span>{formatDate(poll.createdAt)}</span>
    </div>

    <h3>{linkable
      ? <a href={`/polls/${poll.slug}`}>{poll.title}</a>
      : poll.title}</h3>

    {kind === "voted" && poll.selectedOptionTexts?.length > 0 && <p className="profile-vote-choice">
      Your selection{poll.selectedOptionTexts.length === 1 ? "" : "s"}: <strong>{poll.selectedOptionTexts.join(", ")}</strong>
    </p>}

    <div className="profile-poll-footer">
      <span>
        {votes} voter{votes === 1 ? "" : "s"}
        {(poll.contextUpdates || []).length > 0 && <> · {(poll.contextUpdates || []).length} creator update{poll.contextUpdates.length === 1 ? "" : "s"}</>}
      </span>
      <div>
        {linkable && <a className="profile-text-link" href={`/polls/${poll.slug}`}>Open poll ↗</a>}
        {linkable && onContextUpdate && <button
          className="button secondary profile-edit-button"
          type="button"
          onClick={() => onContextUpdate(poll)}
        >
          Add context update
        </button>}
        {poll.canEdit && onEdit && <button className="button secondary profile-edit-button" type="button" onClick={() => onEdit(poll)}>Edit poll</button>}
      </div>
    </div>
  </article>;
}

function PollSection({
  title,
  description,
  polls,
  kind,
  emptyText,
  onEdit,
  onContextUpdate,
  defaultOpen = true
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");

  const filteredPolls = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matching = normalizedQuery
      ? polls.filter((poll) => searchablePollText(poll).includes(normalizedQuery))
      : polls;

    return sortProfilePolls(matching, sort);
  }, [polls, query, sort]);

  return <section className={open ? "profile-section open" : "profile-section collapsed"}>
    <button
      className="profile-section-toggle"
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((current) => !current)}
    >
      <span>
        <small className="kicker">{description}</small>
        <strong>{title}</strong>
      </span>
      <span className="profile-section-toggle-meta">
        <span className="count-badge">{polls.length}</span>
        <span className="collapse-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </span>
    </button>

    {open && <div className="profile-section-content">
      {polls.length === 0
        ? <div className="profile-empty">{emptyText}</div>
        : <>
            <div className="profile-list-tools">
              <label className="profile-search">
                <span className="sr-only">Search {title}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title, category or option…"
                />
              </label>

              <label className="profile-sort">
                <span>Sort</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  {PROFILE_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <div className="profile-results-meta">
              {query
                ? `${filteredPolls.length} match${filteredPolls.length === 1 ? "" : "es"} of ${polls.length}`
                : `${polls.length} poll${polls.length === 1 ? "" : "s"}`}
            </div>

            {filteredPolls.length === 0
              ? <div className="profile-empty compact">No matching polls.</div>
              : <div className="profile-poll-list">
                  {filteredPolls.map((poll) => <PollRow
                    key={poll.id}
                    poll={poll}
                    kind={kind}
                    onEdit={onEdit}
                    onContextUpdate={onContextUpdate}
                  />)}
                </div>}
          </>}
    </div>}
  </section>;
}

function EditPollPanel({ poll, onClose, onSaved }) {
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.rationale || "");
  const [category, setCategory] = useState(poll.category);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(Boolean(poll.allowMultipleAnswers));
  const [options, setOptions] = useState((poll.options || []).map((option) => option.text));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const titleTooLong = title.length > 90;

  function updateOption(index, value) {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  }

  function addOption() {
    setOptions((current) => current.length < 20 ? [...current, ""] : current);
  }

  function removeOption(index) {
    setOptions((current) => current.length > 2 ? current.filter((_, optionIndex) => optionIndex !== index) : current);
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");

    const cleanOptions = options.map((option) => option.trim());
    if (title.trim().length < 10 || title.trim().length > 90) {
      setMessage("The poll question must be between 10 and 90 characters.");
      return;
    }
    if (description.trim().length > 1500) {
      setMessage("Additional context must be 1500 characters or fewer.");
      return;
    }
    if (cleanOptions.some((option) => !option || option.length > 100)) {
      setMessage("Each option must be between 1 and 100 characters.");
      return;
    }
    if (new Set(cleanOptions.map((option) => option.toLocaleLowerCase())).size !== cleanOptions.length) {
      setMessage("Poll options must all be different.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/profile/polls/${encodeURIComponent(poll.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          options,
          allowMultipleAnswers
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Could not save the poll.");
      }

      await onSaved();
      onClose();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="profile-edit-panel">
    <div className="profile-edit-heading">
      <div>
        <p className="kicker">Zero-vote poll</p>
        <h2>Edit your poll</h2>
      </div>
      <button className="button secondary" type="button" onClick={onClose}>Close</button>
    </div>

    <p className="profile-edit-note">You can change this poll because nobody has voted yet. Once the first vote is cast, creator editing locks permanently. Changes are added to the public edit history.</p>

    <form className="poll-form" onSubmit={save}>
      <label className={titleTooLong ? "field field-error" : "field"}>
        <span>Poll question</span>
        <input
          type="text"
          minLength="10"
          maxLength="180"
          required
          aria-invalid={titleTooLong}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <small className={titleTooLong ? "character-count over-limit" : "character-count"}>{title.length}/90</small>
        {titleTooLong && <span className="field-warning">Title is {title.length - 90} character{title.length - 90 === 1 ? "" : "s"} too long.</span>}
      </label>

      <label className="field">
        <span>Additional context <em>(optional)</em></span>
        <textarea rows="5" maxLength="1500" value={description} onChange={(event) => setDescription(event.target.value)} />
        <small>{description.length}/1500</small>
      </label>

      <label className="field">
        <span>Category</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <fieldset className="voting-mode-editor">
        <legend>Voting mode</legend>
        <label className="multi-vote-toggle">
          <input type="checkbox" checked={allowMultipleAnswers} onChange={(event) => setAllowMultipleAnswers(event.target.checked)} />
          <span>
            <strong>Allow multiple answers</strong>
            <small>{allowMultipleAnswers ? "Voters can choose more than one option." : "Voters can choose one option."}</small>
          </span>
        </label>
      </fieldset>

      <fieldset className="option-editor">
        <legend>Poll options</legend>
        <p>Use 2–20 distinct answers.</p>
        {options.map((option, index) => <div className="option-row" key={index}>
          <label className="field option-field">
            <span>Option {index + 1}</span>
            <input type="text" maxLength="100" value={option} onChange={(event) => updateOption(index, event.target.value)} required />
          </label>
          <button className="remove-option" type="button" disabled={options.length <= 2} onClick={() => removeOption(index)}>Remove</button>
        </div>)}
        <button className="button secondary add-option" type="button" disabled={options.length >= 20} onClick={addOption}>+ Add option</button>
      </fieldset>

      <button className="button primary submit-button" type="submit" disabled={saving || titleTooLong}>
        {saving ? "Saving…" : "Save changes"}
      </button>
      {message && <p className="form-message">{message}</p>}
    </form>
  </div>;
}

function ContextUpdatePanel({ poll, onClose, onSaved }) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    const cleanBody = body.trim();
    if (cleanBody.length < 3 || cleanBody.length > 500) {
      setMessage("Context updates must be between 3 and 500 characters.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/profile/polls/${encodeURIComponent(poll.id)}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: cleanBody })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Could not add the context update.");
      }

      await onSaved();
      onClose();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="profile-edit-panel profile-context-update-panel">
    <div className="profile-edit-heading">
      <div>
        <p className="kicker">Creator update</p>
        <h2>Add context without rewriting the poll</h2>
      </div>
      <button className="button secondary" type="button" onClick={onClose}>Close</button>
    </div>

    <p className="profile-edit-note">
      Add a short update when new information changes how voters should read the question. The update is timestamped, cannot be edited afterward, and permanently records the poll results as they looked at that exact moment.
    </p>

    <div className="profile-context-poll-reference">
      <small>Poll</small>
      <strong>{poll.title}</strong>
    </div>

    <form className="poll-form" onSubmit={submit}>
      <label className="field">
        <span>Context update</span>
        <textarea
          rows="4"
          minLength="3"
          maxLength="500"
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Example: For this question, compare the difficulty specifically with Classic Era."
        />
        <small>{body.length}/500</small>
      </label>

      <div className="profile-context-warning">
        <strong>Append-only</strong>
        <span>Posting this will freeze the current voter count and answer percentages alongside the note. It cannot be silently rewritten later.</span>
      </div>

      <button className="button primary submit-button" type="submit" disabled={saving || body.trim().length < 3}>
        {saving ? "Posting update…" : "Post context update"}
      </button>

      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  </div>;
}

export function ProfileDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [editingPoll, setEditingPoll] = useState(null);
  const [contextPoll, setContextPoll] = useState(null);
  const contextPanelRef = useRef(null);

  async function load() {
    const response = await fetch("/api/profile", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      setState({ loading: false, data: null, error: "login_required" });
      return;
    }

    if (!response.ok || !data.ok) {
      throw new Error("Could not load your ForeverVote profile.");
    }

    setState({ loading: false, data, error: "" });
  }

  useEffect(() => {
    load().catch((error) => setState({ loading: false, data: null, error: error.message }));
  }, []);

  useEffect(() => {
    if (!contextPoll || !contextPanelRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      contextPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      const textarea = contextPanelRef.current?.querySelector("textarea");
      window.setTimeout(() => textarea?.focus(), 350);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [contextPoll]);

  if (state.loading) {
    return <div className="profile-loading">Loading your profile…</div>;
  }

  if (state.error === "login_required") {
    return <div className="profile-gate">
      <h2>Login required</h2>
      <p>Connect Battle.net to see your profile, poll submissions, and voting history.</p>
      <a className="button primary" href="/api/auth/login/battlenet">Login with Battle.net</a>
    </div>;
  }

  if (!state.data) {
    return <div className="profile-gate"><h2>Profile unavailable</h2><p>{state.error}</p></div>;
  }

  const { profile, dashboard } = state.data;
  const reputation = dashboard.reputation || {
    rank: "Neutral",
    totalPoints: 0,
    rankPoints: 0,
    rankMax: 3000,
    progressPercent: 0,
    votePoints: 0,
    creatorPoints: 0,
    pollsVoted: 0,
    uniqueVotersReceived: 0
  };
  const reputationRankClass = String(reputation.rank || "Neutral").toLocaleLowerCase();

  return <div className="profile-dashboard">
    <section className="profile-summary">
      <div>
        <p className="kicker">Battle.net profile</p>
        <h1>{profile.battletag}</h1>
        <p className="profile-region">{profile.region ? profile.region.toUpperCase() : "Battle.net"} account verified</p>
      </div>

      <div className="profile-account-checks">
        <div><span>WoW Retail account</span><strong className={profile.hasRetailProfile ? "profile-check yes" : "profile-check no"}>{profile.hasRetailProfile ? "✓ Verified" : "Not found"}</strong></div>
        <div><span>WoW Classic account</span><strong className={profile.hasClassicProfile ? "profile-check yes" : "profile-check no"}>{profile.hasClassicProfile ? "✓ Verified" : "Not found"}</strong></div>
      </div>

      <div className="profile-reputation">
        <div className="profile-reputation-heading">
          <div>
            <span>ForeverVote reputation</span>
            <small>{reputation.totalPoints.toLocaleString()} total reputation</small>
          </div>
          <strong>{reputation.rank}</strong>
        </div>

        <div
          className={`profile-reputation-bar rank-${reputationRankClass}`}
          role="progressbar"
          aria-label={`${reputation.rank} reputation progress`}
          aria-valuemin="0"
          aria-valuemax={reputation.rankMax}
          aria-valuenow={reputation.rankPoints}
        >
          <span className="profile-reputation-fill" style={{ width: `${reputation.progressPercent}%` }} />
          <span className="profile-reputation-value">{reputation.rankPoints.toLocaleString()} / {reputation.rankMax.toLocaleString()}</span>
        </div>

        <div className="profile-reputation-rules">
          <span>Vote on a poll <strong>+50</strong></span>
          <span>Another player votes on your poll <strong>+5</strong></span>
          <span>{reputation.pollsVoted.toLocaleString()} poll{reputation.pollsVoted === 1 ? "" : "s"} voted · {reputation.uniqueVotersReceived.toLocaleString()} creator reward{reputation.uniqueVotersReceived === 1 ? "" : "s"}</span>
        </div>
      </div>
    </section>

    {editingPoll && <EditPollPanel poll={editingPoll} onClose={() => setEditingPoll(null)} onSaved={load} />}
    {contextPoll && <div ref={contextPanelRef} className="profile-context-update-anchor">
      <ContextUpdatePanel poll={contextPoll} onClose={() => setContextPoll(null)} onSaved={load} />
    </div>}

    <PollSection
      title="Submitted polls"
      description="Pending and moderated submissions"
      polls={dashboard.submitted || []}
      emptyText="You have no pending or moderated submissions."
      onEdit={setEditingPoll}
      defaultOpen
    />

    <PollSection
      title="Approved polls"
      description="Your live community polls"
      polls={dashboard.approved || []}
      emptyText="None of your polls are live yet."
      onEdit={(poll) => {
        setContextPoll(null);
        setEditingPoll(poll);
      }}
      onContextUpdate={(poll) => {
        setEditingPoll(null);
        setContextPoll(poll);
      }}
      defaultOpen
    />

    <PollSection
      title="Voted polls"
      description="Polls you have participated in"
      polls={dashboard.voted || []}
      kind="voted"
      emptyText="You have not voted in any polls yet."
      defaultOpen={false}
    />
  </div>;
}
