"use client";

import { useEffect, useState } from "react";
import { pollCategories } from "../data/polls";

const categories = pollCategories.filter((category) => category !== "All");
const defaultOptions = ["Yes", "No", "Don't care"];

export function SubmitPollForm() {
  const [auth, setAuth] = useState({ loading: true, authenticated: false });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [options, setOptions] = useState(defaultOptions);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submission, setSubmission] = useState(null);
  const [adminQueue, setAdminQueue] = useState({ checked: false, allowed: false, submissions: [] });
  const [moderating, setModerating] = useState("");

  async function loadAdminQueue() {
    try {
      const response = await fetch("/api/admin/polls", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setAdminQueue({ checked: true, allowed: false, submissions: [] });
        return;
      }

      setAdminQueue({ checked: true, allowed: true, submissions: data.submissions || [] });
    } catch {
      setAdminQueue({ checked: true, allowed: false, submissions: [] });
    }
  }

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active) {
          setAuth({ loading: false, ...data });
        }
      })
      .catch(() => {
        if (active) {
          setAuth({ loading: false, authenticated: false });
        }
      });

    loadAdminQueue();

    return () => {
      active = false;
    };
  }, []);

  function updateOption(index, value) {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  }

  function addOption() {
    setOptions((current) => current.length < 20 ? [...current, ""] : current);
  }

  function removeOption(index) {
    setOptions((current) => current.length > 2 ? current.filter((_, optionIndex) => optionIndex !== index) : current);
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setSubmission(null);

    try {
      const response = await fetch("/api/polls/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, options })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.message || (
          data.error === "login_required"
            ? "Login with Battle.net before submitting a poll."
            : data.error === "classic_profile_required"
              ? "A Classic WoW profile is required to submit polls."
              : "Could not submit the poll. Check the fields and try again."
        ));
      }

      setSubmission(data.submission);
      setMessage("Submitted for review. It will not appear publicly until it is approved.");
      setTitle("");
      setDescription("");
      setCategory("General");
      setOptions([...defaultOptions]);
      await loadAdminQueue();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function moderate(pollId, action) {
    if (action === "reject" && !window.confirm("Reject this submission? It will be hidden and will not go live.")) {
      return;
    }

    setModerating(`${pollId}:${action}`);

    try {
      const response = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, action })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error("Could not update that submission.");
      }

      setAdminQueue((current) => ({
        ...current,
        submissions: current.submissions.filter((item) => item.id !== pollId)
      }));
      setMessage(action === "publish" ? "Poll approved and published." : "Submission rejected.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setModerating("");
    }
  }

  if (auth.loading) {
    return <div className="submit-panel"><p className="poll-status">Checking Battle.net login…</p></div>;
  }

  if (!auth.authenticated) {
    return <div className="submit-panel submit-gate">
      <h2>Login required</h2>
      <p>Poll submissions are limited to Battle.net accounts with a verified Classic WoW profile.</p>
      <a className="button primary" href="/api/auth/login/battlenet">Login with Battle.net</a>
      <small>After login, return to this page to submit your poll.</small>
    </div>;
  }

  if (!auth.wowProfile?.hasClassicProfile) {
    return <div className="submit-panel submit-gate">
      <h2>Classic profile required</h2>
      <p>Your Battle.net login worked, but ForeverVote could not verify a Classic WoW profile for this account.</p>
      <a className="button secondary" href="/">Back to polls</a>
    </div>;
  }

  return <div className="submit-stack">
    <form className="submit-panel poll-form" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <p className="kicker">Community submission</p>
          <h2>Create a poll</h2>
        </div>
        <span className="count-badge">Review required</span>
      </div>

      <p className="form-intro">Keep the question clear and easy to understand. Add context only when it helps. Submissions are reviewed before they appear on the public poll board.</p>

      <label className="field">
        <span>Poll question</span>
        <input
          type="text"
          minLength="10"
          maxLength="180"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Should WoW Forever…?"
        />
        <small>{title.length}/180</small>
      </label>

      <label className="field">
        <span>Additional context <em>(optional)</em></span>
        <textarea
          maxLength="1500"
          rows="5"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add any background voters should know. Leave blank if the question stands on its own."
        />
        <small>{description.length}/1500</small>
      </label>

      <label className="field">
        <span>Category</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <fieldset className="option-editor">
        <legend>Poll options</legend>
        <p>Use 2–20 distinct answers.</p>
        {options.map((option, index) => <div className="option-row" key={index}>
          <label className="field option-field">
            <span>Option {index + 1}</span>
            <input
              type="text"
              maxLength="100"
              required
              value={option}
              onChange={(event) => updateOption(index, event.target.value)}
              placeholder={index === 0 ? "Yes" : index === 1 ? "No" : "Another choice"}
            />
          </label>
          {options.length > 2 && <button className="remove-option" type="button" onClick={() => removeOption(index)}>Remove</button>}
        </div>)}
        {options.length < 20 && <button className="button secondary add-option" type="button" onClick={addOption}>+ Add option</button>}
      </fieldset>

      <div className="submission-note">
        <strong>Before you submit</strong>
        <span>ForeverVote may reject duplicate, loaded, abusive, promotional, or off-topic polls. Approved wording is locked once a poll goes live.</span>
      </div>

      <button className="button primary submit-button" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit for review"}
      </button>

      {message && <p className={submission ? "form-message success" : "form-message"} role="status">{message}</p>}
      {submission && <p className="submission-id">Reference: {submission.slug}</p>}
    </form>

    {adminQueue.checked && adminQueue.allowed && <section className="moderation-panel" aria-labelledby="moderation-title">
      <div className="form-heading">
        <div>
          <p className="kicker">Admin moderation</p>
          <h2 id="moderation-title">Pending submissions</h2>
        </div>
        <span className="count-badge">{adminQueue.submissions.length} pending</span>
      </div>

      {adminQueue.submissions.length === 0
        ? <p className="empty-queue">Nothing is waiting for review.</p>
        : <div className="moderation-list">
          {adminQueue.submissions.map((poll) => <article className="moderation-card" key={poll.id}>
            <div className="card-top">
              <span className="category">{poll.category}</span>
              <span className="draft">{poll.creatorBattleTag} · {new Date(poll.createdAt).toLocaleDateString()}</span>
            </div>
            <h3>{poll.title}</h3>
            {poll.rationale && <p className="context">{poll.rationale}</p>}
            <div className="moderation-options">
              {poll.options.map((option) => <span key={option.id}>{option.text}</span>)}
            </div>
            <div className="moderation-actions">
              <button
                className="button primary"
                type="button"
                disabled={Boolean(moderating)}
                onClick={() => moderate(poll.id, "publish")}
              >
                {moderating === `${poll.id}:publish` ? "Publishing…" : "Approve & publish"}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={Boolean(moderating)}
                onClick={() => moderate(poll.id, "reject")}
              >
                {moderating === `${poll.id}:reject` ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </article>)}
        </div>}
    </section>}
  </div>;
}
