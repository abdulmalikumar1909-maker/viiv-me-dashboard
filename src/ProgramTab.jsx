import { formatNumber } from "./format.js";
import { DataTable, Panel, Section, Tile } from "./ui.jsx";

const pct = (value) => (value === null || value === undefined ? "–" : `${value}%`);

// The same indicator columns for every breakdown table.
const breakdownColumns = (dimensionKey, dimensionLabel) => [
  { key: dimensionKey, label: dimensionLabel, align: "left", format: (v) => v },
  { key: "Total clients", label: "Total" },
  { key: "Active", label: "Active" },
  { key: "TX_NEW", label: "TX_NEW" },
  { key: "IIT", label: "IIT" },
  { key: "VL coverage %", label: "VL coverage", format: pct },
  { key: "Suppression %", label: "Suppression", format: pct },
  { key: "Unsuppressed", label: "Unsuppressed" },
  { key: "EAC required", label: "EAC" },
  { key: "TX_ML", label: "TX_ML" },
];

// Follow-up workload; each maps to a KPI so the facility filter applies.
const QUEUES = [
  { key: "iitInPeriod", label: "Interrupted treatment this period", tone: "critical" },
  { key: "vlDue", label: "Due for viral load", tone: "warning" },
  { key: "vlPending", label: "VL result pending", tone: "warning" },
  { key: "unsuppressed", label: "Unsuppressed", tone: "critical" },
  { key: "eacRequired", label: "EAC still required", tone: "warning" },
  { key: "postEacVlDue", label: "Post-EAC repeat VL due", tone: "warning" },
  { key: "failedEac", label: "Still unsuppressed after EAC", tone: "critical" },
];

function FollowUpWorkload({ k }) {
  const rows = QUEUES.filter((q) => k[q.key] !== null && k[q.key] !== undefined);
  const max = Math.max(1, ...rows.map((q) => k[q.key]));
  return (
    <Panel title="Follow-up workload" subtitle="Clients in each action queue. The client lists are on the M&E computer only.">
      <ul className="queue-list">
        {rows.map((q) => (
          <li key={q.key} className={k[q.key] ? `queue-${q.tone}` : "queue-clear"}>
            <span className="queue-label">{q.label}</span>
            <span className="queue-count">{formatNumber(k[q.key])}</span>
            <span className="queue-track">
              <span className="queue-fill" style={{ width: `${(k[q.key] / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function FacilityCards({ facilities, columns }) {
  return (
    <div className="facility-cards">
      {facilities.map((f) => (
        <div className="facility-card" key={f.Facility}>
          <h4>{f.Facility}</h4>
          <dl>
            {columns.slice(1).map((c) => (
              <div key={c.key}>
                <dt>{c.label}</dt>
                <dd>{c.format ? c.format(f[c.key]) : formatNumber(f[c.key])}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export default function ProgramTab({ k, data, facilities, totalRow, txNewMonths }) {
  const facilityColumns = breakdownColumns("Facility", "Facility");
  const byLga = (data.byLga || []).filter((r) => r.LGA !== "All");
  const lgaTotal = (data.byLga || []).find((r) => r.LGA === "All");
  const demographics = [
    ...(data.bySex || []).filter((r) => r.Sex !== "All").map((r) => ({ ...r, Group: r.Sex })),
    ...(data.byAgeGroup || []).filter((r) => r["Age Group"] !== "All").map((r) => ({ ...r, Group: `Age ${r["Age Group"]}` })),
  ];
  const txMl = (data.txMl || []).filter((r) => !String(r.Reason).startsWith("All"));

  return (
    <>
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
            note={`ART start in the last ${txNewMonths} months`}
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

      <Section title="Where the work is" subtitle="Action queues for the selected facility">
        <FollowUpWorkload k={k} />
      </Section>

      <Section title="By facility" subtitle="Key M&E indicators for each supported facility">
        <Panel title="Facility summary">
          <div className="wide-only">
            <DataTable columns={facilityColumns} rows={facilities} rowKey={(r) => r.Facility} footer={totalRow && { ...totalRow, Facility: "All facilities" }} />
          </div>
          <div className="narrow-only">
            <FacilityCards facilities={facilities} columns={facilityColumns} />
          </div>
        </Panel>
      </Section>

      <Section title="By LGA, sex and age" subtitle="All facilities; the facility filter does not apply here">
        <Panel title="Local government areas">
          <DataTable columns={breakdownColumns("LGA", "LGA")} rows={byLga} rowKey={(r) => r.LGA} footer={lgaTotal && { ...lgaTotal, LGA: "All LGAs" }} />
        </Panel>
        <Panel title="Sex and age group">
          <DataTable columns={breakdownColumns("Group", "Group")} rows={demographics} rowKey={(r) => r.Group} />
        </Panel>
        {txMl.length > 0 && (
          <Panel title="Why clients left treatment (TX_ML)" subtitle="This fiscal year">
            <DataTable
              columns={[
                { key: "Reason", label: "Reason", align: "left", format: (v) => v },
                { key: "Clients", label: "Clients" },
                { key: "% of TX_ML", label: "Share", format: pct },
              ]}
              rows={txMl}
              rowKey={(r) => r.Reason}
            />
          </Panel>
        )}
      </Section>
    </>
  );
}
