// Builds the public dashboard data from the full (patient-level) export.
// Input:  data-private/me_data.json  (gitignored, never published)
// Output: public/data/me_data.json   (aggregates only, safe to publish)
import { readFileSync, writeFileSync } from "node:fs";

const input = process.argv[2] ?? "data-private/me_data.json";
const output = process.argv[3] ?? "public/data/me_data.json";

const data = JSON.parse(readFileSync(input, "utf8"));

// Drop the per-client records entirely.
delete data.clients;

// Keep queue counts, drop the patient IDs behind them.
data.followUpQueues = (data.followUpQueues ?? []).map(({ patientIds, ...queue }) => queue);

delete data.meta?.sourceFile;

const text = JSON.stringify(data, null, 2);
for (const field of ["patientId", "hospitalNumber", "caseManager"]) {
  if (text.includes(`"${field}"`)) throw new Error(`Refusing to write: output still contains "${field}"`);
}

writeFileSync(output, text + "\n");
console.log(`Wrote ${output} (${text.length} bytes, aggregates only)`);
