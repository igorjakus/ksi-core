import { afterAll, beforeAll, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { digest, challenge, randomToken } from '../domain/sso';
const safe =
  process.env.KSI_ENVIRONMENT === 'integration' &&
  new URL(process.env.DATABASE_URL ?? 'postgres://none@localhost/none').pathname ===
    '/ksi_integration';
const integration = safe ? test : test.skip;
let db: typeof import('../db').db, schema: typeof import('../db'), app: typeof import('../app').app;
const id = `identity-${randomUUID()}`,
  second = `identity-${randomUUID()}`,
  sessionId = `identity-${randomUUID()}`,
  frontend = randomToken();
beforeAll(async () => {
  if (!safe) return;
  schema = await import('../db');
  db = schema.db;
  app = (await import('../app')).app;
  await db.insert(schema.users).values([
    {
      id,
      name: 'Identity admin',
      email: `${id}@example.test`,
      role: 'administrator',
      membershipStatus: 'active'
    },
    { id: second, name: 'Pending account', email: `${second}@example.test` }
  ]);
  await db.insert(schema.sessions).values({
    id: sessionId,
    userId: id,
    token: randomToken(),
    expiresAt: new Date(Date.now() + 3600000),
    updatedAt: new Date()
  });
  await db.insert(schema.frontendSessions).values({
    id: digest(frontend),
    sessionId,
    origin: 'http://localhost:5175',
    environment: 'integration',
    expiresAt: new Date(Date.now() + 3600000)
  });
});
afterAll(async () => {
  if (!safe) return;
  const events = await db
    .select({ id: schema.auditEvents.id })
    .from(schema.auditEvents)
    .where(inArray(schema.auditEvents.targetId, [id, second]));
  if (events.length)
    await db.delete(schema.outbox).where(
      inArray(
        schema.outbox.eventId,
        events.map((e) => e.id)
      )
    );
  await db.delete(schema.auditEvents).where(inArray(schema.auditEvents.targetId, [id, second]));
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
  await db.delete(schema.users).where(inArray(schema.users.id, [id, second]));
});
function request(path: string, method = 'GET', body?: unknown, origin = 'http://localhost:5175') {
  return app.handle(
    new Request(`http://localhost:3000${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-ksi-proxy-key': process.env.PROXY_SECRET!,
        'x-ksi-origin': origin,
        'x-ksi-session': frontend
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  );
}
integration('database authority blocks pending privileges and honors denials', async () => {
  const response = await request(`/users/${second}/access`, 'PATCH', {
    membershipStatus: 'active'
  });
  expect(response.status).toBe(200);
  await db
    .update(schema.users)
    .set({ flags: ['-users.roles.assign'] })
    .where(eq(schema.users.id, id));
  expect((await request(`/users/${second}/access`, 'PATCH', { role: 'board' })).status).toBe(403);
  await db.update(schema.users).set({ flags: [] }).where(eq(schema.users.id, id));
});
integration('last administrator cannot be demoted or deleted', async () => {
  expect((await request(`/users/${id}/access`, 'PATCH', { role: 'member' })).status).toBe(409);
  expect((await request('/users/me', 'DELETE')).status).toBe(409);
});
integration('handoff redemption is environment/origin-bound and single-use', async () => {
  const code = randomToken(),
    verifier = randomToken(),
    state = randomToken(),
    destination = 'http://localhost:5173/sso/callback';
  await db.insert(schema.authHandoffs).values({
    id: digest(code),
    sessionId,
    environment: 'integration',
    destination,
    state,
    challenge: challenge(verifier),
    expiresAt: new Date(Date.now() + 60000)
  });
  const body = { code, verifier, state, destination };
  expect((await request('/sso/redeem', 'POST', body)).status).toBe(403);
  expect(
    (
      await request(
        '/sso/redeem',
        'POST',
        { ...body, verifier: randomToken() },
        'http://localhost:5173'
      )
    ).status
  ).toBe(400);
  const success = await request('/sso/redeem', 'POST', body, 'http://localhost:5173');
  expect(success.status).toBe(200);
  expect(((await success.json()) as { token: string }).token).toHaveLength(43);
  expect((await request('/sso/redeem', 'POST', body, 'http://localhost:5173')).status).toBe(400);
});
integration('expired handoffs cannot authenticate', async () => {
  const code = randomToken(),
    verifier = randomToken(),
    state = randomToken(),
    destination = 'http://localhost:5173/sso/callback';
  await db.insert(schema.authHandoffs).values({
    id: digest(code),
    sessionId,
    environment: 'integration',
    destination,
    state,
    challenge: challenge(verifier),
    expiresAt: new Date(0)
  });
  expect(
    (
      await request(
        '/sso/redeem',
        'POST',
        { code, verifier, state, destination },
        'http://localhost:5173'
      )
    ).status
  ).toBe(400);
});
integration('central revocation invalidates frontend sessions', async () => {
  expect((await request('/users/me')).status).toBe(200);
  expect((await request('/sso/logout', 'POST')).status).toBe(200);
  expect((await request('/users/me')).status).toBe(401);
  expect(
    (
      await db
        .select()
        .from(schema.frontendSessions)
        .where(eq(schema.frontendSessions.sessionId, sessionId))
    ).length
  ).toBe(0);
});
