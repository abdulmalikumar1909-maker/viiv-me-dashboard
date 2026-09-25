import { useState } from "react";
import { Section, StatusIcon } from "./ui.jsx";

// Password screen for the client lists. The password is checked on the server
// (api/clients.js); the page holds no client data until it says yes.
export default function ClientsGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!password.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "Could not sign in. Try again.");
        return;
      }
      setPassword("");
      onUnlock(body);
    } catch {
      setError("No connection to the server. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Clients needing action" subtitle="Password required">
      <form className="gate" onSubmit={submit}>
        <div className="gate-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="5" y="10.5" width="14" height="10" rx="2" />
            <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h3>These lists contain patient information</h3>
        <p>
          Enter the password for your facility. Each facility's password shows only that facility's clients. If you
          don't have one, ask the M&amp;E officer.
        </p>
        <label htmlFor="client-password">Password</label>
        <input
          id="client-password"
          type="password"
          autoComplete="current-password"
          placeholder="xxxx-xxxx-xxxx"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />
        {error && (
          <p className="gate-error" role="alert">
            <StatusIcon tone="critical" />
            {error}
          </p>
        )}
        <button className="button" type="submit" disabled={busy || !password.trim()}>
          {busy ? "Checking…" : "Open client lists"}
        </button>
      </form>
    </Section>
  );
}
