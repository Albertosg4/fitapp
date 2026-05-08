import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SURFACES = [
  { path: "app/admin/page.tsx", required: true },
  { path: "app/socio/page.tsx", required: true },
  { path: "app/checkin/page.tsx", required: false },
  { path: "app/api/register-socio/route.ts", required: false },
  { path: "app/api/reservas/toggle/route.ts", required: false },
  { path: "app/api/checkin/route.ts", required: false },
  { path: "app/api/stripe/checkout/route.ts", required: false },
  { path: "app/api/stripe/webhook/route.ts", required: false },
  { path: "features/admin", required: false },
  { path: "features/socio", required: false },
  { path: "lib/auth/requireAdmin.ts", required: false },
  { path: "lib/auth/requireSocio.ts", required: false },
  { path: "scripts/verify-real-gym-boundaries.mjs", required: true },
];

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function pad(value, width) {
  return value.padEnd(width, " ");
}

const rows = SURFACES.map((surface) => {
  const found = exists(surface.path);
  const status = found ? "OK" : surface.required ? "REQUIRED MISSING" : "OPTIONAL MISSING";
  return { ...surface, status };
});

console.log("Real gym app surfaces inventory");
console.log(`${pad("Status", 18)} ${pad("Required", 8)} Path`);
console.log(`${pad("-".repeat(18), 18)} ${pad("-".repeat(8), 8)} ${"-".repeat(40)}`);

for (const row of rows) {
  console.log(`${pad(row.status, 18)} ${pad(row.required ? "yes" : "no", 8)} ${row.path}`);
}

const missingRequired = rows.filter((row) => row.required && row.status !== "OK");

if (missingRequired.length > 0) {
  console.error("");
  console.error("Missing required real gym app surfaces:");
  for (const row of missingRequired) {
    console.error(`- ${row.path}`);
  }
  process.exit(1);
}

console.log("");
console.log("OK: required real gym app surfaces exist.");
