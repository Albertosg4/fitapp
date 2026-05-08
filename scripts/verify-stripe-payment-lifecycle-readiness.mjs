#!/usr/bin/env node
import fs from 'node:fs'

const required = [
  'app/api/stripe/checkout/route.ts',
  'app/api/stripe/webhook/route.ts',
  'features/socio/components/SocioPagosTab.tsx',
  'features/admin/components/PagosTab.tsx',
  'components/HistorialPagos.tsx',
  'lib/domain/membresias.ts',
  'lib/ui/user-facing-errors.ts',
  'docs/payments/stripe-payment-flow-audit.md',
  'docs/qa/stripe-payment-validation-checklist.md',
]

const optionalSql = [
  'docs/sql/fase-9a-stripe-membership-lifecycle/00_precheck.sql',
  'docs/sql/fase-9a-stripe-membership-lifecycle/01_main.sql',
  'docs/sql/fase-9a-stripe-membership-lifecycle/02_verify.sql',
  'docs/sql/fase-9a-stripe-membership-lifecycle/99_rollback.sql',
  'docs/sql/fase-9a-stripe-membership-lifecycle/README.md',
]

const rows = [...required, ...optionalSql].map((p) => ({ p, ok: fs.existsSync(p), required: required.includes(p) }))
console.log('Status | Required | Path')
for (const r of rows) console.log(`${r.ok ? 'OK' : 'MISSING'} | ${r.required ? 'yes' : 'no'} | ${r.p}`)
if (rows.some((r) => r.required && !r.ok)) process.exit(1)
console.log('OK: Stripe payment lifecycle readiness checks passed.')
