import Elysia, { type ElysiaConfig, status } from 'elysia';
import { db, frontendSessions, sessions, users } from '@ksi-core/server/db';
import { auth } from './auth';
import { and, eq, gt } from 'drizzle-orm';
import { getUrls } from 'shared';
import { effectivePermissions, type Permission } from '../domain/permissions';

export const createContext = (protectedRoute: boolean) => (app: Elysia) =>
  app.derive(async ({ request }) => {
    let user: typeof users.$inferSelect | null = null;
    const proxyKey = request.headers.get('x-ksi-proxy-key');
    const frontendToken = request.headers.get('x-ksi-session');
    if (frontendToken && Bun.env.PROXY_SECRET && proxyKey === Bun.env.PROXY_SECRET) {
      const [record] = await db
        .select({ user: users })
        .from(frontendSessions)
        .innerJoin(sessions, eq(frontendSessions.sessionId, sessions.id))
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
          and(
            eq(
              frontendSessions.id,
              new Bun.CryptoHasher('sha256').update(frontendToken).digest('hex')
            ),
            eq(frontendSessions.environment, getUrls().environment),
            eq(frontendSessions.origin, request.headers.get('x-ksi-origin') ?? ''),
            gt(frontendSessions.expiresAt, new Date()),
            gt(sessions.expiresAt, new Date())
          )
        );
      user = record?.user ?? null;
    } else if (
      proxyKey &&
      Bun.env.PROXY_SECRET &&
      proxyKey === Bun.env.PROXY_SECRET &&
      request.headers.get('x-ksi-origin') === getUrls().frontend.auth
    ) {
      const central = await auth.api.getSession({ headers: request.headers });
      if (central) {
        const [record] = await db.select().from(users).where(eq(users.id, central.user.id));
        user = record ?? null;
      }
    }
    if (protectedRoute && !user) throw status(401, { code: 'AUTH_REQUIRED' });
    return { db, user, unauthorizedError: user ? null : 'AUTH_REQUIRED' };
  });
export function createElysia<P extends string = ''>(
  config?: ElysiaConfig<P> & { protectedRoute?: boolean }
) {
  return new Elysia(config).use(createContext(config?.protectedRoute ?? false));
}
export const createProtectedElysia = <P extends string = ''>(config?: ElysiaConfig<P>) =>
  createElysia({ ...config, protectedRoute: true });
export const createUnprotectedElysia = createElysia;
export function requirePermission(user: typeof users.$inferSelect | null, permission: Permission) {
  if (!user) throw status(401, { code: 'AUTH_REQUIRED' });
  if (!effectivePermissions(user).has(permission))
    throw status(403, {
      code: user.membershipStatus === 'pending' ? 'ACCOUNT_PENDING' : 'FORBIDDEN',
      contact: Bun.env.ACTIVATION_CONTACT ?? 'KSI board'
    });
  return user;
}
