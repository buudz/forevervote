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
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submission, setSubmission] = useState(null);

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
        body: JSON.stringify({ title, description, category, options, allowMultipleAnswers })
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
      setAllowMultipleAnswers(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
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

  return <form className="submit-panel poll-form" onSubmit={submit}>
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

    <fieldset className="voting-mode-editor">
      <legend>Voting mode</legend>
      <label className="multi-vote-toggle">
        <input
          type="checkbox"
          checked={allowMultipleAnswers}
          onChange={(event) => setAllowMultipleAnswers(event.target.checked)}
        />
        <span>
          <strong>Allow multiple answers</strong>
          <small>{allowMultipleAnswers
            ? "Voters can select any number of options. Each option shows the percentage of voters who selected it."
            : "Voters can select one answer. Choosing another answer replaces the previous vote."}</small>
        </span>
      </label>
    </fieldset>

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
      <span>ForeverVote may reject duplicate, loaded, abusive, promotional, or off-topic polls. Answer options and voting mode are locked once a poll goes live; any later admin wording edit is recorded in the public edit history.</span>
    </div>

    <button className="button primary submit-button" type="submit" disabled={submitting}>
      {submitting ? "Submitting…" : "Submit for review"}
    </button>

    {message && <p className={submission ? "form-message success" : "form-message"} role="status">{message}</p>}
    {submission && <p className="submission-id">Reference: {submission.slug}</p>}
  </form>;
}
