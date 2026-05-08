#!/usr/bin/env node

import { access } from 'node:fs/promises'

const requiredPaths = [
  'app/socio/page.tsx',
  'features/socio/components/SocioPagosTab.tsx',
  'components/HistorialPagos.tsx',
  'features/admin/components/PagosTab.tsx',
  'app/api/stripe/checkout/route.ts',
  'lib/domain/membresias.ts',
  'lib/ui/user-facing-errors.ts',
]

const optionalPaths = [
  'app/api/stripe/webhook/route.ts',
  'docs/qa/stripe-payment-validation-checklist.md',
  'docs/payments/stripe-payment-flow-audit.md',
]

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function row(status, required, path) {
  return `${status.padEnd(7)} | ${required.padEnd(8)} | ${path}`
}

async function main() {
  const results = []

  for (const path of requiredPaths) {
    const present = await exists(path)
    results.push({ required: 'yes', path, present })
  }

  for (const path of optionalPaths) {
    const present = await exists(path)
    results.push({ required: 'no', path, present })
  }

  console.log('Status  | Required | Path')
  console.log('--------|----------|-----')

  for (const result of results) {
    console.log(row(result.present ? 'OK' : 'MISSING', result.required, result.path))
  }

  const missingRequired = results.some((r) => r.required === 'yes' && !r.present)

  if (missingRequired) {
    console.error('ERROR: Stripe payment surface audit failed.')
    process.exit(1)
  }

  console.log('OK: Stripe payment surfaces exist.')
}

main()
