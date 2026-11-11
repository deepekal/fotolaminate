import { scryptSync, timingSafeEqual, randomBytes } from "node:crypto";

// Admin users come from ADMIN_USERS: a JSON array of { "username": "...", "hash": "scrypt:<salt>:<key>" } (no "$": Next.js would expand it).
// Generate a hash with:  npx tsx server/scripts/hash-password.ts 'the-password'
// Falls back to the single ADMIN_USERNAME / ADMIN_PASSWORD pair when ADMIN_USERS is not set.

type AdminUser = { username: string; hash?: string; password?: string };

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, KEYLEN).toString("hex")}`;
}

function verifyHash(password: string, stored: string): boolean {
  const [scheme, salt, key] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function loadUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS?.trim();
  if (raw) {
    try {
      const list = JSON.parse(raw) as AdminUser[];
      if (Array.isArray(list)) return list.filter((u) => u && typeof u.username === "string" && (u.hash || u.password));
    } catch {
      console.error("[auth] ADMIN_USERS is not valid JSON");
      return [];
    }
  }
  const u = process.env.ADMIN_USERNAME ?? "";
  const p = process.env.ADMIN_PASSWORD ?? "";
  return u && p ? [{ username: u, password: p }] : [];
}

export function adminUsersConfigured() {
  return loadUsers().length > 0;
}

/** Usernames are case-insensitive (so an email address works however it's typed). */
export function checkCredentials(username: string, password: string): boolean {
  const name = username.trim().toLowerCase();
  let ok = false;
  for (const u of loadUsers()) {
    if (u.username.trim().toLowerCase() !== name) continue;
    ok = u.hash ? verifyHash(password, u.hash) : safeEqual(password, u.password ?? "");
  }
  return ok;
}

/* ------------------------------------------------------------------ lockout */
// After MAX_FAILS wrong attempts for the same username or from the same IP within
// WINDOW, further attempts are refused for LOCK. In memory — resets on restart.

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

type Entry = { fails: number; first: number; lockedUntil: number };
const attempts = new Map<string, Entry>();

function keysFor(ip: string, username: string) {
  return [`ip:${ip}`, `user:${username.trim().toLowerCase()}`];
}

/** Milliseconds until login is allowed again, or 0 when not locked. */
export function lockRemaining(ip: string, username: string): number {
  const now = Date.now();
  let wait = 0;
  for (const k of keysFor(ip, username)) {
    const e = attempts.get(k);
    if (e && e.lockedUntil > now) wait = Math.max(wait, e.lockedUntil - now);
  }
  return wait;
}

export function recordFailure(ip: string, username: string) {
  const now = Date.now();
  for (const k of keysFor(ip, username)) {
    const e = attempts.get(k);
    const entry = !e || now - e.first > WINDOW_MS ? { fails: 0, first: now, lockedUntil: 0 } : e;
    entry.fails += 1;
    if (entry.fails >= MAX_FAILS) entry.lockedUntil = now + LOCK_MS;
    attempts.set(k, entry);
  }
  if (attempts.size > 5000) {
    for (const [k, e] of attempts) if (e.lockedUntil < now && now - e.first > WINDOW_MS) attempts.delete(k);
  }
}

export function recordSuccess(ip: string, username: string) {
  for (const k of keysFor(ip, username)) attempts.delete(k);
}

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}
