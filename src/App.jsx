import { useEffect, useState } from "react";
import "./App.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function App() {
  const [data, setData] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState("All Facilities");

  const loadData = async () => {
    try {
      const response = await fetch(`/data/me_data.json?t=${Date.now()}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="dashboard loading">
        <h1>ViiV M&E Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

 const k = data?.kpis;
 console.log("Dashboard data:", data);
console.log("Dashboard KPIs:", k);
const facilities = data?.byFacility || [];

if (!k) {
  return <div className="dashboard">Loading dashboard...</div>;
}
  const selected =
    selectedFacility === "All Facilities"
      ? null
      : facilities.find(
          (facility) => facility.Facility === selectedFacility
        );

  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <div className="header-logo">
          <img
            src="/AHNi_logo.png"
            alt="AHNi Logo"
            className="ahni-logo"
          />
        </div>

        <div className="header-text">
          <h1>ViiV M&E Dashboard</h1>
          <p>HIV Program Monitoring & Evaluation</p>
          <small>
            FY{data.meta.fiscalYear} • Reporting period{" "}
            {data.meta.periodStart} to {data.meta.periodEnd}
          </small>
        </div>

        <div className="live-status">
          <span className="status-dot"></span>
          Live
        </div>
      </header>


      <section>
        <div className="section-title">
          <div>
            <h2>Program Overview</h2>
            <p>Overall performance of the supported ART cohort</p>
          </div>
        </div>

        <div className="kpi-grid">

          <div className="card primary">
            <span>Total Clients</span>
            <strong>{k.totalClients}</strong>
          </div>

          <div className="card">
            <span>Active on ART</span>
            <strong>{k.active}</strong>
          </div>

          <div className="card success">
            <span>Suppressed</span>
            <strong>{k.suppressed}</strong>
          </div>

          <div className="card danger">
            <span>Unsuppressed</span>
            <strong>{k.unsuppressed}</strong>
          </div>

          <div className="card">
            <span>Suppression Rate</span>
            <strong>{k.suppressionRate}%</strong>
          </div>

          <div className="card">
            <span>Undetectable Rate</span>
            <strong>{k.undetectableRate}%</strong>
          </div>

        </div>
      </section>


      <section>
        <div className="section-title">
          <div>
            <h2>Viral Load Monitoring</h2>
            <p>VL eligibility, coverage and follow-up</p>
          </div>
        </div>

        <div className="kpi-grid kpi-grid-fixed">

          <div className="card">
            <span>VL Eligible</span>
            <strong>{k.vlEligible}</strong>
          </div>

          <div className="card success">
            <span>VL Covered</span>
            <strong>{k.vlCovered}</strong>
          </div>

          <div className="card">
            <span>VL Coverage</span>
            <strong>{k.vlCoverageRate}%</strong>
          </div>

          <div className="card warning">
            <span>VL Due</span>
            <strong>{k.vlDue}</strong>
          </div>

          <div className="card warning">
            <span>VL Pending</span>
            <strong>{k.vlPending}</strong>
          </div>

        </div>
      </section>


      <section>
        <div className="section-title">
          <div>
            <h2>Treatment Monitoring</h2>
            <p>Client retention and treatment movement</p>
          </div>
        </div>

        <div className="kpi-grid">

          <div className="card warning">
            <span>Total IIT</span>
            <strong>{k.iit}</strong>
          </div>

          <div className="card danger">
            <span>IIT This Period</span>
            <strong>{k.iitInPeriod}</strong>
          </div>

          <div className="card">
            <span>TX_ML</span>
            <strong>{k.txMl}</strong>
          </div>

        </div>
      </section>


      <section>
        <div className="section-title">
          <div>
            <h2>EAC & Post-EAC Monitoring</h2>
            <p>Enhanced adherence counselling and repeat VL monitoring</p>
          </div>
        </div>

        <div className="kpi-grid">

          <div className="card warning">
            <span>EAC Required</span>
            <strong>{k.eacRequired}</strong>
          </div>

          <div className="card warning">
            <span>Post-EAC VL Due</span>
            <strong>{k.postEacVlDue}</strong>
          </div>

          <div className="card danger">
            <span>Still Unsuppressed After EAC</span>
            <strong>{k.failedEac}</strong>
          </div>

        </div>
      </section>


      <section className="facility-section">

        <div className="section-title">
          <div>
            <h2>Facility Performance</h2>
            <p>Performance across supported ART facilities</p>
          </div>

          <div className="facility-count">
            {facilities.length} Facilities
          </div>
        </div>


        <div className="facility-selector">

          <label htmlFor="facility">
            View facility:
          </label>

          <select
            id="facility"
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
          >

            <option value="All Facilities">
              All Facilities
            </option>

            {facilities.map((facility) => (
              <option
                key={facility.Facility}
                value={facility.Facility}
              >
                {facility.Facility}
              </option>
            ))}

          </select>

        </div>


        {selected && (
          <div className="selected-facility">

            <div className="selected-header">
              <div>
                <span>Selected Facility</span>
                <h3>{selected.Facility}</h3>
              </div>
            </div>

            <div className="kpi-grid">

              <div className="card">
                <span>Total Clients</span>
                <strong>{selected["Total clients"]}</strong>
              </div>

              <div className="card">
                <span>Active</span>
                <strong>{selected.Active}</strong>
              </div>

              <div className="card success">
                <span>Suppressed</span>
                <strong>{selected.Suppressed}</strong>
              </div>

              <div className="card danger">
                <span>Unsuppressed</span>
                <strong>{selected.Unsuppressed}</strong>
              </div>

              <div className="card">
                <span>VL Coverage</span>
                <strong>{selected["VL coverage %"]}%</strong>
              </div>

              <div className="card">
                <span>Suppression</span>
                <strong>{selected["Suppression %"]}%</strong>
              </div>

            </div>

          </div>
        )}


        <div className="chart-card">

          <div className="chart-header">
            <div>
              <h3>Suppression Rate by Facility</h3>
              <p>Percentage of VL-eligible clients with viral load below 1,000 copies/ml</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={facilities}
                margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="Facility"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={90}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Suppression"]}
                />
                <Bar
                  dataKey="Suppression %"
                  name="Suppression"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="chart-card">

          <div className="chart-header">
            <div>
              <h3>Viral Load Coverage by Facility</h3>
              <p>Current VL results among VL-eligible clients</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={facilities}
                margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="Facility"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={90}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "VL Coverage"]}
                />
                <Bar
                  dataKey="VL coverage %"
                  name="VL Coverage"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="table-card">

          <div className="table-header">
            <div>
              <h3>Facility Summary</h3>
              <p>Key M&E indicators by facility</p>
            </div>
          </div>

          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Total</th>
                  <th>Active</th>
                  <th>IIT</th>
                  <th>VL Coverage</th>
                  <th>Suppression</th>
                  <th>Unsuppressed</th>
                  <th>EAC</th>
                  <th>TX_ML</th>
                </tr>
              </thead>

              <tbody>

                {facilities.map((facility) => (
                  <tr key={facility.Facility}>

                    <td className="facility-name">
                      {facility.Facility}
                    </td>

                    <td>{facility["Total clients"]}</td>

                    <td>{facility.Active}</td>

                    <td>{facility.IIT}</td>

                    <td>
                      <span className="percentage">
                        {facility["VL coverage %"]}%
                      </span>
                    </td>

                    <td>
                      <span className="percentage">
                        {facility["Suppression %"]}%
                      </span>
                    </td>

                    <td>{facility.Unsuppressed}</td>

                    <td>{facility["EAC required"]}</td>

                    <td>{facility.TX_ML}</td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </section>


      <footer>

        <strong>ViiV M&E Dashboard</strong>

        <span>
          Source: {data.meta.sourceFile}
        </span>

        <span>
          Last updated:{" "}
          {new Date(data.meta.generatedAt).toLocaleString("en-GB")}
        </span>

      </footer>

    </div>
  );
}

export default App;






