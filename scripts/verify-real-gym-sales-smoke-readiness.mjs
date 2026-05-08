import fs from 'node:fs';

const checks = [
  { required: true, path: 'docs/qa/real-gym-sales-smoke-test.md' },
  { required: true, path: 'docs/product/real-gym-sales-demo-script.md' },
  { required: true, path: 'docs/qa/real-gym-validation-report-template.md' },
  { required: true, path: 'docs/product/real-gym-commercial-validation-checklist.md' },
  { required: true, path: 'docs/product/real-gym-sales-readiness-audit.md' },
  { required: true, path: 'scripts/verify-real-gym-boundaries.mjs' },
  { required: true, path: 'scripts/audit-real-gym-app-surfaces.mjs' },
  { required: true, path: 'app/admin/page.tsx' },
  { required: true, path: 'app/socio/page.tsx' },
  { required: false, path: 'app/checkin/page.tsx' }
];

console.log('Status | Required | Path');
console.log('--- | --- | ---');

let hasRequiredMissing = false;

for (const check of checks) {
  const exists = fs.existsSync(check.path);
  const requiredLabel = check.required ? 'YES' : 'OPTIONAL';

  let status;
  if (exists) {
    status = 'OK';
  } else if (check.required) {
    status = 'MISSING';
    hasRequiredMissing = true;
  } else {
    status = 'OPTIONAL MISSING';
  }

  console.log(`${status} | ${requiredLabel} | ${check.path}`);
}

if (hasRequiredMissing) {
  console.error('ERROR: real gym sales smoke readiness checks failed.');
  process.exit(1);
}

console.log('OK: real gym sales smoke readiness docs and surfaces exist.');
process.exit(0);
