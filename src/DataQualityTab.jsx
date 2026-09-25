import { ALL, formatNumber } from "./format.js";
import { Panel, Section, StatusIcon, Tile } from "./ui.jsx";

// "Potiskum General Hospital" -> "Potiskum GH", so the facility columns fit.
const shortName = (name) =>
  name
    .replace(/ General Hospital$/, " GH")
    .replace(/ Federal Medical Centre$/, " FMC")
    .replace(/ Specialist Hospital$/, " SH");

function CohortFunnel({ cohort, excluded }) {
  const steps = [
    { label: "Rows in the combined RADET", value: cohort.rowsInExport },
    { label: `Rows in ${cohort.state} State`, value: cohort.rowsInState },
    { label: `Aged ${cohort.ageRange} in the ${cohort.facilities} supported facilities`, value: cohort.rowsKept },
    { label: "Valid records used for indicators", value: cohort.rowsKept - excluded },
  ];
  return (
    <Panel title="From RADET to dashboard" subtitle="How many rows each filter keeps">
      <ol className="funnel">
        {steps.map((s) => (
          <li key={s.label}>
            <span className="funnel-value">{formatNumber(s.value)}</span>
            <span className="funnel-label">{s.label}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function IssueRates({ facilities, checks, rowsByFacility, selectedFacility, onSelect }) {
  const rates = facilities
    .map((f) => {
      const issues = checks.reduce((sum, c) => sum + (c.byFacility[f] || 0), 0);
      const rows = rowsByFacility[f] || 0;
      return { facility: f, issues, rows, rate: rows ? Math.round((issues / rows) * 1000) / 10 : 0 };
    })
    .sort((a, b) => b.rate - a.rate);
  const max = Math.max(1, ...rates.map((r) => r.rate));

  return (
    <Panel title="Issues per 100 records" subtitle="Highest first. Tap a facility to filter the checks below.">
      <ul className="bars">
        {rates.map((r) => (
          <li key={r.facility}>
            <button
              className={`bar-row ${selectedFacility === r.facility ? "is-selected" : ""}`}
              onClick={() => onSelect(selectedFacility === r.facility ? ALL : r.facility)}
              title={`${r.facility}: ${r.issues} issues in ${r.rows} records`}
            >
              <span className="bar-name">{r.facility}</span>
              <span className="bar-value">{r.rate}</span>
              <span className="bar-track">
                <span className="bar-fill bar-fill-warning" style={{ width: `${(r.rate / max) * 100}%` }} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ChecksTable({ checks, facilities, selected }) {
  const shown = selected ? [selected] : facilities;
  const sorted = [...checks].sort((a, b) => b.total - a.total);
  const count = (c) => (selected ? c.byFacility[selected] || 0 : c.total);

  return (
    <Panel
      title="Checks"
      subtitle={selected ? `Records affected at ${selected}` : "Records affected, overall and by facility"}
    >
      <div className="data-table-wrap">
        <table className="data-table dq-table">
          <thead>
            <tr>
              <th className="is-left">Check</th>
              {!selected && <th>Total</th>}
              {shown.map((f) => (
                <th key={f} title={f}>
                  {shortName(f)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.check}>
                <td className="is-left">
                  <span className={`dq-status ${count(c) ? "has-issues" : "is-clean"}`}>
                    <StatusIcon tone={count(c) ? "warning" : "good"} />
                  </span>
                  {c.check}
                </td>
                {!selected && <td className="dq-total">{formatNumber(c.total)}</td>}
                {shown.map((f) => (
                  <td key={f} className={c.byFacility[f] ? "dq-hit" : "dq-zero"}>
                    {c.byFacility[f] ? formatNumber(c.byFacility[f]) : "·"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function DataQualityTab({ data, facilities, selected, selectedFacility, onSelect }) {
  const dq = data.dataQuality;
  if (!dq) {
    return (
      <Section title="Data quality">
        <p className="empty-note">Data quality results will appear after the next RADET is processed.</p>
      </Section>
    );
  }

  const checks = dq.checks;
  const pick = (c) => (selected ? c.byFacility[selected] || 0 : c.total);
  const failing = checks.filter((c) => pick(c) > 0);
  const issues = checks.reduce((sum, c) => sum + pick(c), 0);
  const records = selected ? dq.rowsByFacility[selected] || 0 : Object.values(dq.rowsByFacility).reduce((a, b) => a + b, 0);
  const excluded = data.meta.recordsExcluded ?? 0;

  return (
    <>
      <Section
        title="Data quality"
        subtitle={`${checks.length} automatic checks on every RADET · ${selected ? selected : "all facilities"}`}
      >
        <div className="tiles">
          <Tile label="Records checked" value={records} />
          <Tile
            label="Checks passed"
            value={checks.length - failing.length}
            suffix={` of ${checks.length}`}
            tone={failing.length ? undefined : "good"}
          />
          <Tile
            label="Issues found"
            value={issues}
            tone={issues ? "warning" : "good"}
            note="Recording errors for facilities to correct in the EMR, added up across all checks. One client can have more than one."
          />
        </div>
      </Section>

      <Section title="Where the issues are">
        <IssueRates
          facilities={facilities}
          checks={checks}
          rowsByFacility={dq.rowsByFacility}
          selectedFacility={selectedFacility}
          onSelect={onSelect}
        />
        <ChecksTable checks={checks} facilities={facilities} selected={selected} />
      </Section>

      {data.meta.cohort && (
        <Section title="Cohort filter">
          <CohortFunnel cohort={data.meta.cohort} excluded={excluded} />
        </Section>
      )}
    </>
  );
}
