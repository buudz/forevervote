"use client";

import { useEffect, useState } from "react";
import { pollCategories } from "../data/polls";

const categories = pollCategories.filter((category) => category !== "All");

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

function PollRow({ poll, kind, onEdit }) {
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
      <span>{votes} voter{votes === 1 ? "" : "s"}</span>
      <div>
        {linkable && <a className="profile-text-link" href={`/polls/${poll.slug}`}>Open poll ↗</a>}
        {poll.canEdit && onEdit && <button className="button secondary profile-edit-button" type="button" onClick={() => onEdit(poll)}>Edit poll</button>}
      </div>
    </div>
  </article>;
}

function PollSection({ title, description, polls, kind, emptyText, onEdit }) {
  return <section className="profile-section">
    <div className="profile-section-heading">
      <div>
        <p className="kicker">{description}</p>
        <h2>{title}</h2>
      </div>
      <span className="count-badge">{polls.length}</span>
    </div>

    {polls.length
      ? <div className="profile-poll-list">
          {polls.map((poll) => <PollRow key={poll.id} poll={poll} kind={kind} onEdit={onEdit} />)}
        </div>
      : <div className="profile-empty">{emptyText}</div>}
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

export function ProfileDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [editingPoll, setEditingPoll] = useState(null);

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

  return <div className="profile-dashboard">
    <section className="profile-summary">
      <div>
        <p className="kicker">Battle.net profile</p>
        <h1>{profile.battletag}</h1>
        <p className="profile-region">{profile.region ? profile.region.toUpperCase() : "Battle.net"} account connected</p>
      </div>

      <div className="profile-account-checks">
        <div><span>WoW Retail account</span><strong className={profile.hasRetailProfile ? "profile-check yes" : "profile-check no"}>{profile.hasRetailProfile ? "✓ Connected" : "Not found"}</strong></div>
        <div><span>WoW Classic account</span><strong className={profile.hasClassicProfile ? "profile-check yes" : "profile-check no"}>{profile.hasClassicProfile ? "✓ Connected" : "Not found"}</strong></div>
      </div>
    </section>

    {editingPoll && <EditPollPanel poll={editingPoll} onClose={() => setEditingPoll(null)} onSaved={load} />}

    <PollSection
      title="Submitted polls"
      description="Pending and moderated submissions"
      polls={dashboard.submitted || []}
      emptyText="You have no pending or moderated submissions."
      onEdit={setEditingPoll}
    />

    <PollSection
      title="Approved polls"
      description="Your live community polls"
      polls={dashboard.approved || []}
      emptyText="None of your polls are live yet."
      onEdit={setEditingPoll}
    />

    <PollSection
      title="Voted polls"
      description="Polls you have participated in"
      polls={dashboard.voted || []}
      kind="voted"
      emptyText="You have not voted in any polls yet."
    />
  </div>;
}
