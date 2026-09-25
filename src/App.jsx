import { useEffect, useState } from "react";
import "./App.css";

// UNAIDS 95-95-95: the programme benchmark for VL coverage and suppression.
const TARGET = 95;
const ALL = "All Facilities";

const FACILITY_METRICS = [
  { key: "Suppression %", label: "Suppression", higherIsBetter: true },
  { key: "VL coverage %", label: "VL coverage", higherIsBetter: true },
  { key: "IIT %", label: "IIT", higherIsBetter: false },
];

const formatNumber = (value) =>
  value === null || value === undefined ? "–" : Number(value).toLocaleString("en-GB");

const formatDate = (iso, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      })
    : "–";

const percent = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

// Facility rows use spreadsheet-style column names; map them onto the KPI names.
function facilityKpis(row) {
  return {
    totalClients: row["Total clients"],
    active: row.Active,
    txNew: row.TX_NEW,
    iit: row.IIT,
    iitInPeriod: row["IIT this period"],
    txMl: row.TX_ML,
    vlEligible: row["VL eligible"],
    vlCovered: row["With current VL"],
    vlCoverageRate: row["VL coverage %"],
    suppressed: row.Suppressed,
    suppressionRate: row["Suppression %"],
    unsuppressed: row.Unsuppressed,
    vlDue: row["VL due"],
    vlPending: row["VL pending"],
    eacRequired: row["EAC required"],
    postEacVlDue: row["Post-EAC VL due"],
    // Not broken down by facility in the source data.
    undetectableRate: null,
    failedEac: null,
  };
}

function StatusIcon({ tone }) {
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

function Tile({ label, value, suffix = "", tone, note }) {
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

function Meter({ label, value, detail }) {
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

function Section({ title, subtitle, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function FacilityBars({ facilities, selectedFacility, onSelect }) {
  const [metricKey, setMetricKey] = useState(FACILITY_METRICS[0].key);
  const metric = FACILITY_METRICS.find((m) => m.key === metricKey);
  const sorted = [...facilities].sort((a, b) =>
    metric.higherIsBetter ? b[metricKey] - a[metricKey] : a[metricKey] - b[metricKey]
  );
  const showTarget = metric.higherIsBetter;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>{metric.label} by facility</h3>
          <p>
            {metric.higherIsBetter ? "Highest first" : "Lowest first"}
            {showTarget && ` · line marks the ${TARGET}% target`}. Tap a facility to filter.
          </p>
        </div>
        <div className="segmented" role="tablist" aria-label="Facility metric">
          {FACILITY_METRICS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={m.key === metricKey}
              className={m.key === metricKey ? "active" : ""}
              onClick={() => setMetricKey(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="bars">
        {sorted.map((f) => (
          <li key={f.Facility}>
            <button
              className={`bar-row ${selectedFacility === f.Facility ? "is-selected" : ""}`}
              onClick={() => onSelect(selectedFacility === f.Facility ? ALL : f.Facility)}
              title={`${f.Facility}: ${f[metricKey]}% (${formatNumber(f["Total clients"])} clients)`}
            >
              <span className="bar-name">{f.Facility}</span>
              <span className="bar-value">{f[metricKey]}%</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${Math.min(f[metricKey], 100)}%` }} />
                {showTarget && <span className="bar-target" style={{ left: `${TARGET}%` }} />}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FacilityTable({ facilities, total }) {
  const columns = [
    ["Total clients", "Total"],
    ["Active", "Active"],
    ["TX_NEW", "TX_NEW"],
    ["IIT", "IIT"],
    ["VL coverage %", "VL coverage", "%"],
    ["Suppression %", "Suppression", "%"],
    ["Unsuppressed", "Unsuppressed"],
    ["EAC required", "EAC"],
    ["TX_ML", "TX_ML"],
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Facility summary</h3>
          <p>Key M&amp;E indicators by facility</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              {columns.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facilities.map((f) => (
              <tr key={f.Facility}>
                <td className="facility-name">{f.Facility}</td>
                {columns.map(([key, , suffix = ""]) => (
                  <td key={key}>
                    {formatNumber(f[key])}
                    {suffix}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {total && (
            <tfoot>
              <tr>
                <td>All facilities</td>
                {columns.map(([key, , suffix = ""]) => (
                  <td key={key}>
                    {formatNumber(total[key])}
                    {suffix}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="facility-cards">
        {facilities.map((f) => (
          <div className="facility-card" key={f.Facility}>
            <h4>{f.Facility}</h4>
            <dl>
              {columns.map(([key, label, suffix = ""]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>
                    {formatNumber(f[key])}
                    {suffix}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(ALL);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/data/me_data.json?t=${Date.now()}`);
        setData(await response.json());
        setError(false);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(true);
      }
    };

    loadData();
    // The data only changes when a new RADET is published; once a minute is plenty.
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data?.kpis) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>{error ? "Could not load dashboard data. Retrying…" : "Loading dashboard…"}</p>
      </div>
    );
  }

  const allRows = data.byFacility || [];
  const facilities = allRows.filter((f) => f.Facility !== "All");
  const totalRow = allRows.find((f) => f.Facility === "All");
  const selected = facilities.find((f) => f.Facility === selectedFacility);
  const k = selected ? facilityKpis(selected) : data.kpis;
  const scope = selected ? selected.Facility : "All facilities";

  return (
    <div className="dashboard">
      <header className="header">
        <div className="brand">
          <img src="/AHNi_logo.png" alt="AHNi" className="logo" />
          <div>
            <h1>Lafiyan Matasa Dashboard</h1>
            <p>Adolescent HIV programme monitoring &amp; evaluation · Yobe State</p>
          </div>
        </div>
        <div className="header-meta">
          <span className="pill">FY{data.meta.fiscalYear}</span>
          <span className="pill">
            {formatDate(data.meta.periodStart)} – {formatDate(data.meta.periodEnd)}
          </span>
          <span className="pill pill-live">
            <span className="status-dot" />
            Updated {formatDate(data.meta.generatedAt, true)}
          </span>
        </div>
      </header>

      <div className="filter-bar">
        <label htmlFor="facility">Facility</label>
        <select
          id="facility"
          value={selectedFacility}
          onChange={(e) => setSelectedFacility(e.target.value)}
        >
          <option value={ALL}>All facilities ({facilities.length})</option>
          {facilities.map((f) => (
            <option key={f.Facility} value={f.Facility}>
              {f.Facility}
            </option>
          ))}
        </select>
        {selected && (
          <button className="clear" onClick={() => setSelectedFacility(ALL)}>
            Show all
          </button>
        )}
      </div>

      <div className="hero">
        <div className="hero-card hero-main">
          <div className="hero-label">Active on ART · {scope}</div>
          <div className="hero-value">{formatNumber(k.active)}</div>
          <div className="hero-detail">
            <span>
              of {formatNumber(k.totalClients)} clients ever enrolled (
              {percent(k.active, k.totalClients)}%)
            </span>
          </div>
        </div>
        <Meter
          label="Viral load coverage"
          value={k.vlCoverageRate}
          detail={`${formatNumber(k.vlCovered)} of ${formatNumber(k.vlEligible)} eligible`}
        />
        <Meter
          label="Viral suppression"
          value={k.suppressionRate}
          detail={`${formatNumber(k.suppressed)} suppressed (<1,000 c/ml)`}
        />
      </div>

      <Section title="Viral load" subtitle="Eligibility, results and follow-up">
        <div className="tiles">
          <Tile label="VL eligible" value={k.vlEligible} />
          <Tile label="With current VL" value={k.vlCovered} />
          <Tile label="Suppressed" value={k.suppressed} tone="good" />
          <Tile label="Unsuppressed" value={k.unsuppressed} tone="critical" />
          <Tile label="Undetectable rate" value={k.undetectableRate} suffix="%" note="<50 c/ml" />
          <Tile label="VL due" value={k.vlDue} tone={k.vlDue ? "warning" : undefined} />
          <Tile label="VL pending" value={k.vlPending} tone={k.vlPending ? "warning" : undefined} />
        </div>
      </Section>

      <Section title="Treatment & retention" subtitle="New clients, interruptions and clients leaving treatment">
        <div className="tiles">
          <Tile
            label="New on ART (TX_NEW)"
            value={k.txNew}
            tone={k.txNew ? "good" : undefined}
            note={`ART start in the last ${data.kpis.txNewMonths ?? 6} months`}
          />
          <Tile label="Total IIT" value={k.iit} tone="warning" />
          <Tile label="IIT this period" value={k.iitInPeriod} tone={k.iitInPeriod ? "critical" : undefined} />
          <Tile label="TX_ML" value={k.txMl} note="Left treatment this FY" />
        </div>
      </Section>

      <Section title="Enhanced adherence counselling" subtitle="EAC and repeat viral load">
        <div className="tiles">
          <Tile label="EAC required" value={k.eacRequired} tone="warning" />
          <Tile label="Post-EAC VL due" value={k.postEacVlDue} tone="warning" />
          <Tile label="Unsuppressed after EAC" value={k.failedEac} tone="critical" />
        </div>
      </Section>

      <Section title="Facility performance" subtitle={`${facilities.length} supported ART facilities`}>
        <FacilityBars
          facilities={facilities}
          selectedFacility={selectedFacility}
          onSelect={setSelectedFacility}
        />
        <FacilityTable facilities={facilities} total={totalRow} />
      </Section>

      <footer className="footer">
        <strong>Lafiyan Matasa</strong>
        <span>Implemented by AHNi with support from ViiV Healthcare</span>
        <span>Data generated {formatDate(data.meta.generatedAt, true)}</span>
        <span>Aggregate figures only · no client-level data</span>
      </footer>
    </div>
  );
}

export default App;
