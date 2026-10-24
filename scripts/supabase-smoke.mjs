import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const app = fileURLToPath(new URL('../apps/client-console/', import.meta.url))
const { createClient } = createRequire(
  new URL('../apps/client-console/package.json', import.meta.url),
)('@supabase/supabase-js')
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
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(status.API_URL).hostname), 'Local tests only')
const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY ?? status.SECRET_KEY, options)
const first = createClient(status.API_URL, key, options)
const second = createClient(status.API_URL, key, options)
const anonymous = createClient(status.API_URL, key, options)
const id = randomUUID()
const password = `Hackathon-${randomUUID()}`
const users = []
const path = `smoke-tests/${id}.txt`

function checked(result) {
  assert.ifError(result.error)
  return result.data
}

try {
  for (const [index, client] of [first, second].entries()) {
    const identity = checked(
      await client.auth.signUp({
        email: `callpilot-smoke-${id}-${index}@example.com`,
        password,
        options: { data: { name: `Smoke User ${index}` } },
      }),
    )
    assert.ok(identity.user)
    users.push(identity.user.id)
    assert.ok(identity.session, 'Signup should create a session without email confirmation')
    const profile = checked(
      await client.from('profiles').select('*').eq('id', identity.user.id).single(),
    )
    assert.equal(profile.name, `Smoke User ${index}`)
    assert.equal(profile.email, identity.user.email)
  }
  console.log('PASS: email/password signup, immediate sessions, and automatic profiles')

  const organization = checked(
    await first.rpc('create_organization', { organization_name: ' Smoke Organization ' }).single(),
  )
  assert.equal(organization.name, 'Smoke Organization')
  assert.equal(organization.created_by, users[0])
  const membership = checked(
    await first
      .from('organization_members')
      .select('*')
      .eq('organization_id', organization.id)
      .single(),
  )
  assert.equal(membership.role, 'SUPER_ADMIN')
  assert.equal(membership.user_id, users[0])
  const invalid = await second.rpc('create_organization', { organization_name: '   ' })
  assert.ok(invalid.error, 'Blank organization names should be rejected')
  const retried = checked(
    await first.rpc('create_organization', { organization_name: 'Retry' }).single(),
  )
  assert.equal(retried.id, organization.id, 'Setup retries must return the existing organization')
  const duplicateOrganization = await first
    .from('organizations')
    .insert({ name: 'Duplicate', created_by: users[0] })
  assert.ok(duplicateOrganization.error, 'A user must not create a second organization')
  console.log('PASS: atomic organization setup and default SUPER_ADMIN membership')

  checked(await second.from('organizations').select('*').eq('id', organization.id).single())
  const anonymousRead = await anonymous.from('profiles').select('*')
  assert.ok(anonymousRead.error || anonymousRead.data.length === 0)
  console.log('PASS: broad signed-in access; anonymous callers cannot read profiles')

  checked(
    await first.storage
      .from('documents')
      .upload(path, new Blob(['Supabase smoke test'], { type: 'text/plain' })),
  )
  const download = checked(await second.storage.from('documents').download(path))
  assert.equal(await download.text(), 'Supabase smoke test')
  checked(await second.storage.from('documents').remove([path]))
  console.log('PASS: authenticated storage upload, cross-user download, and delete')

  const diagnostic = checked(
    await first.functions.invoke('list-users-organizations', { method: 'GET' }),
  )
  const listed = diagnostic.users.find((user) => user.id === users[0])
  assert.ok(listed)
  assert.ok(
    diagnostic.users.some((user) => user.id === users[1] && user.organizations.length === 0),
  )
  assert.equal(listed.organizations[0].id, organization.id)
  assert.equal(listed.organizations[0].role, 'SUPER_ADMIN')
  const unauthorized = await fetch(`${status.API_URL}/functions/v1/list-users-organizations`)
  assert.equal(unauthorized.status, 401)
  const invalidToken = await fetch(`${status.API_URL}/functions/v1/list-users-organizations`, {
    headers: { Authorization: 'Bearer invalid-token' },
  })
  assert.equal(invalidToken.status, 401)
  const preflight = await fetch(`${status.API_URL}/functions/v1/list-users-organizations`, {
    method: 'OPTIONS',
  })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*')
  console.log('PASS: diagnostic function, auth rejection, and CORS preflight')

  const email = (await first.auth.getUser()).data.user.email
  checked(await first.auth.signOut())
  const session = checked(await first.auth.getSession())
  assert.equal(session.session, null)
  assert.ok((await first.auth.signInWithPassword({ email, password: 'wrong-password' })).error)
  checked(await first.auth.signInWithPassword({ email, password }))
  console.log('PASS: signout, invalid password rejection, and password signin')
} finally {
  checked(await admin.storage.from('documents').remove([path]))
  for (const userId of users) checked(await admin.auth.admin.deleteUser(userId))
  await first.auth.signOut()
  await second.auth.signOut()
}

console.log('Local Supabase smoke test passed; temporary users, organizations, and files removed.')
