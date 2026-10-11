import { status, t } from 'elysia';
import { and, eq, gt } from 'drizzle-orm';
import { createElysia } from '../../lib/createElysia';
import { auth } from '../../lib/auth';
import { authHandoffs, frontendSessions, sessions } from '../../db';
import { challenge, digest, randomToken, validateDestination } from '../../domain/sso';
import { getUrls } from 'shared';
export const ssoRoutes = createElysia({ prefix: '/sso' })
  .onBeforeHandle(({ request }) => {
    if (!Bun.env.PROXY_SECRET || request.headers.get('x-ksi-proxy-key') !== Bun.env.PROXY_SECRET)
      throw status(403, { code: 'PROXY_REQUIRED' });
  })
  .get('/session', ({ user }) => ({ user }))
  .post(
    '/authorize',
    async ({ db, body, request }) => {
      if (request.headers.get('x-ksi-origin') !== getUrls().frontend.auth) throw status(403);
      validateDestination(body.destination, [
        getUrls().frontend.landing,
        getUrls().frontend.dashboard
      ]);
      const central = await auth.api.getSession({ headers: request.headers });
      if (!central) throw status(401, { code: 'AUTH_REQUIRED' });
      if (
        central.user.membershipStatus === 'deleted' ||
        central.user.membershipStatus === 'suspended'
      )
        throw status(403);
      const code = randomToken();
      await db.insert(authHandoffs).values({
        id: digest(code),
        sessionId: central.session.id,
        environment: getUrls().environment,
        destination: body.destination,
        state: body.state,
        challenge: body.challenge,
        expiresAt: new Date(Date.now() + 60000)
      });
      return { code, state: body.state };
    },
    {
      body: t.Object({
        destination: t.String({ maxLength: 500 }),
        state: t.String({ minLength: 32, maxLength: 128 }),
        challenge: t.String({ pattern: '^[A-Za-z0-9_-]{43}$' })
      })
    }
  )
  .post(
    '/redeem',
    async ({ db, body, request }) => {
      validateDestination(body.destination, [
        getUrls().frontend.landing,
        getUrls().frontend.dashboard
      ]);
      if (new URL(body.destination).origin !== request.headers.get('x-ksi-origin'))
        throw status(403);
      return db.transaction(async (tx) => {
        const [handoff] = await tx
          .delete(authHandoffs)
          .where(
            and(
              eq(authHandoffs.id, digest(body.code)),
              eq(authHandoffs.environment, getUrls().environment),
              eq(authHandoffs.destination, body.destination),
              eq(authHandoffs.state, body.state),
              eq(authHandoffs.challenge, challenge(body.verifier)),
              gt(authHandoffs.expiresAt, new Date())
            )
          )
          .returning();
        if (!handoff) throw status(400, { code: 'INVALID_HANDOFF' });
        const [central] = await tx
          .select()
          .from(sessions)
          .where(and(eq(sessions.id, handoff.sessionId), gt(sessions.expiresAt, new Date())));
        if (!central) throw status(401);
        const token = randomToken();
        await tx.insert(frontendSessions).values({
          id: digest(token),
          sessionId: central.id,
          environment: getUrls().environment,
          origin: new URL(body.destination).origin,
          expiresAt: central.expiresAt
        });
        return { token, expiresAt: central.expiresAt.toISOString() };
      });
    },
    {
      body: t.Object({
        code: t.String({ pattern: '^[A-Za-z0-9_-]{43}$' }),
        state: t.String({ minLength: 32, maxLength: 128 }),
        verifier: t.String({ pattern: '^[A-Za-z0-9_-]{43,128}$' }),
        destination: t.String({ maxLength: 500 })
      })
    }
  )
  .post('/logout', async ({ db, request }) => {
    const token = request.headers.get('x-ksi-session');
    if (token) {
      const [frontend] = await db
        .select()
        .from(frontendSessions)
        .where(
          and(
            eq(frontendSessions.id, digest(token)),
            eq(frontendSessions.origin, request.headers.get('x-ksi-origin') ?? '')
          )
        );
      if (frontend) await db.delete(sessions).where(eq(sessions.id, frontend.sessionId));
    }
    return { success: true };
  });
