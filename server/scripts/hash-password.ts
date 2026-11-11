// Usage: npx tsx server/scripts/hash-password.ts 'the-password'
import { hashPassword } from "../lib/admin-auth";

const pw = process.argv[2];
if (!pw) {
  console.error("Usage: npx tsx server/scripts/hash-password.ts 'the-password'");
  process.exit(1);
}
console.log(hashPassword(pw));
