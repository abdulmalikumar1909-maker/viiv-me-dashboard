// Constants and formatting helpers shared by every dashboard tab.

// UNAIDS 95-95-95: the programme benchmark for VL coverage and suppression.
export const TARGET = 95;
export const ALL = "All Facilities";

export const formatNumber = (value) =>
  value === null || value === undefined ? "–" : Number(value).toLocaleString("en-GB");

export const formatDate = (iso, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      })
    : "–";

export const percent = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

// Facility rows use spreadsheet-style column names; map them onto the KPI names.
export function facilityKpis(row) {
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
