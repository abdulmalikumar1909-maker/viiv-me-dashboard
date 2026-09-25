import { useState } from "react";
import { ALL, TARGET, formatNumber, percent } from "./format.js";
import { Meter, Panel, Section, Tile } from "./ui.jsx";

const FACILITY_METRICS = [
  { key: "Suppression %", label: "Suppression", higherIsBetter: true },
  { key: "VL coverage %", label: "VL coverage", higherIsBetter: true },
  { key: "IIT %", label: "IIT", higherIsBetter: false },
];

function FacilityBars({ facilities, selectedFacility, onSelect }) {
  const [metricKey, setMetricKey] = useState(FACILITY_METRICS[0].key);
  const metric = FACILITY_METRICS.find((m) => m.key === metricKey);
  const sorted = [...facilities].sort((a, b) =>
    metric.higherIsBetter ? b[metricKey] - a[metricKey] : a[metricKey] - b[metricKey]
  );
  const showTarget = metric.higherIsBetter;

  return (
    <Panel
      title={`${metric.label} by facility`}
      subtitle={`${metric.higherIsBetter ? "Highest first" : "Lowest first"}${
        showTarget ? ` · line marks the ${TARGET}% target` : ""
      }. Tap a facility to filter.`}
      actions={
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
      }
    >
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
    </Panel>
  );
}

export default function ExecutiveTab({ k, scope, txNewMonths, facilities, selectedFacility, onSelect }) {
  return (
    <>
      <div className="hero">
        <div className="hero-card hero-main">
          <div className="hero-label">Active on ART · {scope}</div>
          <div className="hero-value">{formatNumber(k.active)}</div>
          <div className="hero-detail">
            <span>
              of {formatNumber(k.totalClients)} clients ever enrolled ({percent(k.active, k.totalClients)}%)
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

      <Section title="This period at a glance" subtitle="Clients joining, leaving and needing clinical follow-up">
        <div className="tiles">
          <Tile
            label="New on ART (TX_NEW)"
            value={k.txNew}
            tone={k.txNew ? "good" : undefined}
            note={`ART start in the last ${txNewMonths} months`}
          />
          <Tile label="Left treatment (TX_ML)" value={k.txMl} note="This fiscal year" />
          <Tile label="IIT this period" value={k.iitInPeriod} tone={k.iitInPeriod ? "critical" : undefined} />
          <Tile label="Unsuppressed" value={k.unsuppressed} tone={k.unsuppressed ? "critical" : undefined} />
        </div>
      </Section>

      <Section title="Facility ranking" subtitle={`${facilities.length} supported ART facilities`}>
        <FacilityBars facilities={facilities} selectedFacility={selectedFacility} onSelect={onSelect} />
      </Section>
    </>
  );
}
