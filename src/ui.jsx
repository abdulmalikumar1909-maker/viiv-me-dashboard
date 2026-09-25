// Shared building blocks for every dashboard tab.

import { TARGET, formatNumber } from "./format.js";

export function StatusIcon({ tone }) {
  if (tone === "good") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    );
  }
  if (tone === "warning" || tone === "critical") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 3v6M8 12.5v.5" />
      </svg>
    );
  }
  return null;
}

export function Tile({ label, value, suffix = "", tone, note }) {
  return (
    <div className={`tile ${tone ? `tile-${tone}` : ""}`}>
      <div className="tile-label">
        {tone && (
          <span className="tile-icon">
            <StatusIcon tone={tone} />
          </span>
        )}
        {label}
      </div>
      <div className="tile-value">
        {formatNumber(value)}
        {value !== null && value !== undefined && suffix}
      </div>
      {note && <div className="tile-note">{note}</div>}
    </div>
  );
}

export function Meter({ label, value, detail }) {
  const met = value >= TARGET;
  return (
    <div className="hero-card">
      <div className="hero-label">{label}</div>
      <div className="hero-value">
        {formatNumber(value)}
        <span>%</span>
      </div>
      <div
        className="meter"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="meter-fill" style={{ width: `${Math.min(value, 100)}%` }} />
        <div className="meter-target" style={{ left: `${TARGET}%` }} />
      </div>
      <div className="hero-detail">
        <span>{detail}</span>
        <span className={`target-flag ${met ? "is-met" : "is-below"}`}>
          <StatusIcon tone={met ? "good" : "warning"} />
          {met ? `Meets ${TARGET}% target` : `Below ${TARGET}% target`}
        </span>
      </div>
    </div>
  );
}

export function Section({ title, subtitle, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function Panel({ title, subtitle, actions, children }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

// A plain table that scrolls sideways on narrow screens.
// columns: [{ key, label, align?, format? }]
export function DataTable({ columns, rows, rowKey, footer }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === "left" ? "is-left" : ""}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey ? rowKey(row) : i}>
              {columns.map((c) => (
                <td key={c.key} className={c.align === "left" ? "is-left" : ""}>
                  {c.format ? c.format(row[c.key], row) : formatNumber(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr>
              {columns.map((c) => (
                <td key={c.key} className={c.align === "left" ? "is-left" : ""}>
                  {c.format ? c.format(footer[c.key], footer) : formatNumber(footer[c.key])}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
