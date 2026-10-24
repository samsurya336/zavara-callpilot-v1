import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const app = fileURLToPath(new URL('../apps/client-console/', import.meta.url))
const target = new URL('../apps/client-console/.env.local', import.meta.url)

if (existsSync(target)) {
  console.log('.env.local already exists; keeping your settings unchanged.')
} else {
  const status = JSON.parse(
    execFileSync(
      'corepack',
      ['pnpm', 'exec', 'supabase', '--workdir', '../..', 'status', '-o', 'json'],
      {
        cwd: app,
        encoding: 'utf8',
      },
    ),
  )
  const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY
  if (!status.API_URL || !key)
    throw new Error('Start local Supabase before generating the environment.')

  writeFileSync(
    target,
    `VITE_SUPABASE_URL=${status.API_URL}\nVITE_SUPABASE_PUBLISHABLE_KEY=${key}\n`,
    { flag: 'wx' },
  )
  console.log('Created apps/client-console/.env.local with local browser-safe configuration.')
}
