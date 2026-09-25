// POST /api/clients  { "password": "..." }
// Returns the client lists for the facility that password belongs to.
//
// Vercel environment variables (Project → Settings → Environment Variables):
//   CLIENT_PASSWORDS        hashed passwords from `python make_passwords.py` on the M&E PC
//   AZURE_PRIVATE_BLOB_URL  read-only SAS link to the private client file,
//                           from `python make_private_sas.py` on the M&E PC

import { handleClientsRequest, parseAccounts } from "./_lib.js";

async function loadFromAzure() {
  const url = process.env.AZURE_PRIVATE_BLOB_URL;
  if (!url) throw new Error("AZURE_PRIVATE_BLOB_URL is not set");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Azure returned ${response.status}`);
  return response.json();
}

export default async function handler(req, res) {
  const { status, body } = await handleClientsRequest({
    method: req.method,
    body: req.body,
    accounts: parseAccounts(process.env.CLIENT_PASSWORDS),
    loadData: loadFromAzure,
  });
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}
