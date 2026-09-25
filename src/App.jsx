import { useEffect, useState } from "react";
import "./App.css";
import { ALL, facilityKpis, formatDate } from "./format.js";
import { StatusIcon } from "./ui.jsx";
import ExecutiveTab from "./ExecutiveTab.jsx";
import ProgramTab from "./ProgramTab.jsx";
import DataQualityTab from "./DataQualityTab.jsx";
import ClientsTab from "./ClientsTab.jsx";
import ClientsGate from "./ClientsGate.jsx";

// RADETs arrive daily; older data than this means the update pipeline has stopped.
const STALE_AFTER_DAYS = 2;

// On the M&E computer (npm run private) the client lists load directly from
// data-private. Everywhere else they need a password checked by api/clients.js.
// Add ?login to a local address to test the password screen.
const IS_LOCAL =
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname) &&
  !new URLSearchParams(window.location.search).has("login");
// Signed-in client lists are cleared after this long.
const CLIENT_SESSION_MINUTES = 30;

const TABS = [
  { id: "executive", label: "Executive", question: "How are we performing?" },
  { id: "program", label: "Program & M&E", question: "Where are the problems?" },
  { id: "quality", label: "Data quality", question: "Can we trust the numbers?" },
  { id: "clients", label: "Clients needing action", question: "Which clients require action?", locked: true },
];

const tabFromHash = () => {
  const id = window.location.hash.replace("#", "");
  return TABS.some((t) => t.id === id) ? id : "executive";
};

function App() {
  const [data, setData] = useState(null);
  // Client lists: { data, facility, local } once unlocked, otherwise null.
  const [clientAccess, setClientAccess] = useState(null);
  const [error, setError] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(ALL);
  const [tab, setTab] = useState(tabFromHash);
  // When the data was last fetched; used to spot a dashboard that has stopped updating.
  const [checkedAt, setCheckedAt] = useState(() => Date.now());

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/data/me_data.json?t=${Date.now()}`);
        setData(await response.json());
        setCheckedAt(Date.now());
        setError(false);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(true);
      }
      if (IS_LOCAL) {
        try {
          const response = await fetch(`/__private/me_data.json?t=${Date.now()}`);
          if (response.ok) setClientAccess({ data: await response.json(), facility: "*", local: true });
        } catch {
          // No private data on this machine; the Clients tab stays hidden.
        }
      }
    };

    loadData();
    // The data only changes when a new RADET is published; once a minute is plenty.
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Lock the client lists again after a while, so an unattended screen doesn't stay open.
  useEffect(() => {
    if (!clientAccess || clientAccess.local) return undefined;
    const timer = setTimeout(() => setClientAccess(null), CLIENT_SESSION_MINUTES * 60_000);
    return () => clearTimeout(timer);
  }, [clientAccess]);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!data?.kpis) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>{error ? "Could not load dashboard data. Retrying…" : "Loading dashboard…"}</p>
      </div>
    );
  }

  const tabs = TABS;
  const activeTab = tabs.some((t) => t.id === tab) ? tab : "executive";
  const current = tabs.find((t) => t.id === activeTab);

  const allRows = data.byFacility || [];
  const facilities = allRows.filter((f) => f.Facility !== "All");
  const totalRow = allRows.find((f) => f.Facility === "All");
  const selected = facilities.find((f) => f.Facility === selectedFacility);
  const k = selected ? facilityKpis(selected) : data.kpis;
  const scope = selected ? selected.Facility : "All facilities";
  const txNewMonths = data.kpis.txNewMonths ?? 6;
  const ageDays = (checkedAt - new Date(data.meta.generatedAt).getTime()) / 86_400_000;
  const isStale = ageDays > STALE_AFTER_DAYS;

  const openTab = (id) => {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  };

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
          <span className={`pill pill-live ${isStale ? "is-stale" : ""}`}>
            <span className="status-dot" />
            Updated {formatDate(data.meta.generatedAt, true)}
          </span>
        </div>
      </header>

      {isStale && (
        <div className="stale-banner" role="status">
          <StatusIcon tone="warning" />
          <span>
            <strong>These figures may be out of date.</strong> The data was last refreshed{" "}
            {Math.floor(ageDays)} days ago, on {formatDate(data.meta.generatedAt, true)}. New RADETs are
            normally published within a day.
          </span>
        </div>
      )}

      <nav className="tabs" role="tablist" aria-label="Dashboard views">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === activeTab}
            aria-controls="tab-panel"
            className={`tab ${t.id === activeTab ? "active" : ""} ${t.locked ? "tab-private" : ""}`}
            onClick={() => openTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="filter-bar">
        <label htmlFor="facility">Facility</label>
        <select id="facility" value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)}>
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
        <span className="tab-question">{current.question}</span>
      </div>

      <main id="tab-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "executive" && (
          <ExecutiveTab
            k={k}
            scope={scope}
            txNewMonths={txNewMonths}
            facilities={facilities}
            selectedFacility={selectedFacility}
            onSelect={setSelectedFacility}
          />
        )}
        {activeTab === "program" && (
          <ProgramTab k={k} data={data} facilities={facilities} totalRow={totalRow} txNewMonths={txNewMonths} />
        )}
        {activeTab === "quality" && (
          <DataQualityTab
            data={data}
            facilities={facilities.map((f) => f.Facility)}
            selected={selected?.Facility}
            selectedFacility={selectedFacility}
            onSelect={setSelectedFacility}
          />
        )}
        {activeTab === "clients" &&
          (clientAccess ? (
            <ClientsTab
              privateData={clientAccess.data}
              // A facility password only ever shows its own facility.
              selected={clientAccess.facility === "*" ? selected?.Facility : clientAccess.facility}
              signedInAs={clientAccess.local ? null : clientAccess.facility === "*" ? "Admin (all facilities)" : clientAccess.facility}
              onLock={clientAccess.local ? null : () => setClientAccess(null)}
            />
          ) : (
            <ClientsGate onUnlock={(body) => setClientAccess({ data: body, facility: body.facility, local: false })} />
          ))}
      </main>

      <footer className="footer">
        <strong>Lafiyan Matasa</strong>
        <span>Implemented by AHNi with support from ViiV Healthcare</span>
        <span>Data generated {formatDate(data.meta.generatedAt, true)}</span>
        <span>{clientAccess ? "Client lists open: patient information on screen" : "Aggregate figures only · client lists need a password"}</span>
      </footer>
    </div>
  );
}

export default App;
