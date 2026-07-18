#!/usr/bin/env node
/**
 * Set a user's role by email (replaces any existing roles). Handy for testing
 * both ends with one login — flip between super_admin and verified_student.
 *
 *   node scripts/set-role.mjs <email> <role> [--remote]
 *
 * Examples:
 *   node scripts/set-role.mjs imtiaz.hossain@g.bracu.ac.bd super_admin
 *   node scripts/set-role.mjs imtiaz.hossain@g.bracu.ac.bd verified_student
 *   node scripts/set-role.mjs imtiaz.hossain@g.bracu.ac.bd super_admin --remote
 *
 * The user must have signed in at least once (so their row exists). If the email
 * isn't found, nothing changes.
 */
import { execSync } from "node:child_process";

const ROLES = ["unverified", "pending", "verified_student", "moderator", "admin", "super_admin"];
const [, , email, role, scope] = process.argv;

if (!email || !role) {
  console.error("usage: node scripts/set-role.mjs <email> <role> [--remote]");
  process.exit(1);
}
if (!ROLES.includes(role)) {
  console.error("role must be one of:", ROLES.join(", "));
  process.exit(1);
}
const target = scope === "--remote" ? "--remote" : "--local";
const run = (sql) =>
  execSync(`npx wrangler d1 execute bracu_vault ${target} --command ${JSON.stringify(sql)}`, { stdio: "inherit" });

run(`DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = '${email}')`);
run(`INSERT INTO user_roles (user_id, role_id, granted_at) SELECT id, '${role}', strftime('%s','now') FROM users WHERE email = '${email}'`);
console.log(`\n✔ Set ${email} → ${role} on ${target.replace("--", "")} D1`);
