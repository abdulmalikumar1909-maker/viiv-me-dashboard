// Password check and facility filtering for the protected client lists.
// Files starting with "_" in api/ are helpers, not endpoints, on Vercel.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// The admin account sees every facility.
export const ALL_FACILITIES = "*";

const KEY_LENGTH = 32;

// "salt:hash" in hex. Only this is stored in Vercel; never the password.
export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

// CLIENT_PASSWORDS is a JSON array: [{ "facility": "...", "hash": "salt:hash" }].
export function parseAccounts(json) {
  try {
    const accounts = JSON.parse(json || "[]");
    return Array.isArray(accounts) ? accounts.filter((a) => a?.facility && a?.hash?.includes(":")) : [];
  } catch {
    return [];
  }
}

// Checks every account so a wrong password takes as long as a right one.
export function findAccount(password, accounts) {
  let match = null;
  for (const account of accounts) {
    const [salt, hash] = account.hash.split(":");
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(password, salt, KEY_LENGTH);
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) match = account;
  }
  return match;
}

// Keep only what the Clients tab needs, and only for the account's facility.
export function restrictToFacility(data, facility) {
  const everyone = facility === ALL_FACILITIES;
  const clients = (data.clients || []).filter((c) => everyone || c.facility === facility);
  const allowed = new Set(clients.map((c) => String(c.patientId)));
  const keep = (ids) => (ids || []).filter((id) => allowed.has(String(id)));

  return {
    facility,
    generatedAt: data.meta?.generatedAt ?? null,
    clients,
    followUpQueues: (data.followUpQueues || []).map((q) => {
      const patientIds = keep(q.patientIds);
      return { key: q.key, label: q.label, count: patientIds.length, patientIds };
    }),
    dataQuality: {
      checks: (data.dataQuality?.checks || []).map((c) => ({ check: c.check, patientIds: keep(c.patientIds) })),
    },
  };
}

const MAX_PASSWORD_LENGTH = 200;
const FAILED_SIGN_IN_DELAY_MS = 1000;

// One request to the client lists. loadData() returns the full private JSON.
// Returns { status, body } so both Vercel and the local dev server can use it.
export async function handleClientsRequest({ method, body, accounts, loadData, log = console }) {
  if (method !== "POST") return { status: 405, body: { error: "Use POST." } };
  if (!accounts.length) return { status: 503, body: { error: "Client lists are not set up yet." } };

  const password = typeof body?.password === "string" ? body.password.trim() : "";
  const account =
    password && password.length <= MAX_PASSWORD_LENGTH ? findAccount(password, accounts) : null;
  if (!account) {
    // Slows down anyone guessing passwords.
    await new Promise((resolve) => setTimeout(resolve, FAILED_SIGN_IN_DELAY_MS));
    log.warn("client-lists: failed sign-in");
    return { status: 401, body: { error: "Incorrect password." } };
  }

  let data;
  try {
    data = await loadData();
  } catch (error) {
    log.error(`client-lists: could not load data: ${error.message}`);
    return { status: 502, body: { error: "Could not load the client lists. Try again in a few minutes." } };
  }

  log.log(`client-lists: opened by ${account.facility === ALL_FACILITIES ? "admin" : account.facility}`);
  return { status: 200, body: restrictToFacility(data, account.facility) };
}
