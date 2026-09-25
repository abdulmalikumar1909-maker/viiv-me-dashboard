import { useMemo, useState } from "react";
import { formatDate, formatNumber } from "./format.js";
import { Panel, Section, StatusIcon } from "./ui.jsx";

// Patient-level lists. The data arrives either from data-private on the M&E
// computer, or from api/clients.js after a password check (already limited
// to the signed-in facility).

const COLUMNS = [
  { key: "hospitalNumber", label: "Hospital no." },
  { key: "facility", label: "Facility" },
  { key: "sex", label: "Sex" },
  { key: "age", label: "Age" },
  { key: "artStatus", label: "ART status" },
  { key: "lastPickup", label: "Last pickup", date: true },
  { key: "currentVl", label: "Current VL" },
  { key: "vlResultDate", label: "VL date", date: true },
  { key: "eacSessions", label: "EAC sessions" },
  { key: "postEacVl", label: "Post-EAC VL" },
  { key: "caseManager", label: "Case manager" },
];

const cell = (client, column) => {
  const value = client[column.key];
  if (value === null || value === undefined || value === "") return "–";
  if (column.date) return formatDate(value);
  if (typeof value === "number") return formatNumber(value);
  return value;
};

function downloadCsv(filename, clients) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    COLUMNS.map((c) => quote(c.label)).join(","),
    ...clients.map((client) => COLUMNS.map((c) => quote(client[c.key])).join(",")),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ClientsTab({ privateData, selected, signedInAs, onLock }) {
  const allLists = useMemo(() => {
    const followUp = (privateData.followUpQueues || []).map((q) => ({
      id: `q-${q.key}`,
      group: "Follow-up",
      label: q.label,
      ids: q.patientIds || [],
    }));
    const quality = (privateData.dataQuality?.checks || [])
      .filter((c) => c.patientIds?.length)
      .map((c) => ({ id: `dq-${c.check}`, group: "Data to correct", label: c.check, ids: c.patientIds }));
    return [...followUp, ...quality];
  }, [privateData]);

  const clientsById = useMemo(
    () => new Map((privateData.clients || []).map((c) => [String(c.patientId), c])),
    [privateData]
  );

  // Invalid records are left out of the client file by design, so a data
  // check whose records are all invalid (e.g. invalid ART status) has no list.
  const lists = allLists.filter(
    (l) => l.group !== "Data to correct" || l.ids.some((id) => clientsById.has(String(id)))
  );

  const [listId, setListId] = useState(() => lists.find((l) => l.ids.length)?.id ?? lists[0]?.id);
  const [search, setSearch] = useState("");
  const list = lists.find((l) => l.id === listId);

  const rows = useMemo(() => {
    if (!list) return [];
    const term = search.trim().toLowerCase();
    return list.ids
      .map((id) => clientsById.get(String(id)))
      .filter(Boolean)
      .filter((c) => !selected || c.facility === selected)
      .filter((c) => !term || String(c.hospitalNumber ?? "").toLowerCase().includes(term))
      .sort((a, b) => String(a.facility).localeCompare(b.facility) || String(a.hospitalNumber).localeCompare(b.hospitalNumber));
  }, [list, clientsById, selected, search]);

  const countFor = (l) =>
    l.ids.filter((id) => {
      const c = clientsById.get(String(id));
      return c && (!selected || c.facility === selected);
    }).length;

  const groups = [...new Set(lists.map((l) => l.group))];
  const fileName = `${(list?.label || "clients").replace(/[^a-z0-9]+/gi, "_")}_${selected ? selected.replace(/\s+/g, "_") : "all_facilities"}.csv`;

  return (
    <>
      <div className="private-note" role="note">
        <StatusIcon tone="warning" />
        <span>
          <strong>Patient information.</strong>{" "}
          {signedInAs ? `Signed in as ${signedInAs}. Lists lock again after 30 minutes. ` : "Opened on the M&E computer. "}
          Share exported lists only with the facility team that follows these clients up.
        </span>
        {onLock && (
          <button className="button button-quiet" onClick={onLock}>
            Lock
          </button>
        )}
      </div>

      <Section title="Clients needing action" subtitle={selected ? selected : "All facilities"}>
        {groups.map((group) => (
          <div className="list-group" key={group}>
            <h3 className="list-group-title">{group}</h3>
            <div className="chips" role="tablist" aria-label={group}>
              {lists
                .filter((l) => l.group === group)
                .map((l) => {
                  const n = countFor(l);
                  return (
                    <button
                      key={l.id}
                      role="tab"
                      aria-selected={l.id === listId}
                      className={`chip ${l.id === listId ? "active" : ""} ${n ? "" : "is-empty"}`}
                      onClick={() => setListId(l.id)}
                    >
                      {l.label}
                      <span className="chip-count">{n}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

        {list && (
          <Panel
            title={list.label}
            subtitle={`${rows.length} client${rows.length === 1 ? "" : "s"}${search ? ` matching "${search}"` : ""}`}
            actions={
              <div className="list-actions">
                <label className="visually-hidden" htmlFor="client-search">
                  Search by hospital number
                </label>
                <input
                  id="client-search"
                  type="search"
                  placeholder="Search hospital no."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="button" onClick={() => downloadCsv(fileName, rows)} disabled={!rows.length}>
                  Export CSV
                </button>
              </div>
            }
          >
            {rows.length ? (
              <div className="data-table-wrap">
                <table className="data-table client-table">
                  <thead>
                    <tr>
                      {COLUMNS.map((c) => (
                        <th key={c.key} className="is-left">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((client) => (
                      <tr key={client.patientId}>
                        {COLUMNS.map((c) => (
                          <td key={c.key} className="is-left">
                            {cell(client, c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-note">No clients in this list{selected ? ` at ${selected}` : ""}.</p>
            )}
          </Panel>
        )}
      </Section>
    </>
  );
}
