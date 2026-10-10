import { status, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { users, auditEvents, outbox } from '../../db';
import { createElysia, requirePermission } from '../../lib/createElysia';
import { manageUser, anonymizeUser } from '../../services/users';
import { effectivePermissions, type Permission } from '../../domain/permissions';
export const userRoutes = createElysia({ prefix: '/users', protectedRoute: true })
  .get('/me', ({ user }) => ({ user, permissions: user ? [...effectivePermissions(user)] : [] }))
  .patch(
    '/me',
    async ({ user, body, db }) => {
      const mappings: Record<string, Permission> = {
        firstName: 'users.profile.edit-first-name',
        lastName: 'users.profile.edit-last-name',
        nickname: 'users.profile.edit-nickname',
        bio: 'users.profile.edit-bio',
        github: 'users.profile.edit-social-links',
        linkedin: 'users.profile.edit-social-links',
        publicPrivacy: 'users.profile.edit-privacy'
      };
      for (const key of Object.keys(body)) requirePermission(user, mappings[key]!);
      if (!user) throw status(401);
      return db.transaction(async (tx) => {
        const [updated] = await tx
          .update(users)
          .set({
            ...body,
            name:
              [body.firstName ?? user.firstName, body.lastName ?? user.lastName]
                .filter(Boolean)
                .join(' ') || user.name
          })
          .where(eq(users.id, user.id))
          .returning();
        const [event] = await tx
          .insert(auditEvents)
          .values({
            actorId: user.id,
            targetId: user.id,
            action: 'users.profile.updated',
            metadata: { fields: Object.keys(body) }
          })
          .returning();
        await tx.insert(outbox).values({ eventId: event!.id });
        return { user: updated };
      });
    },
    {
      body: t.Object(
        {
          firstName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
          lastName: t.Optional(t.String({ maxLength: 100 })),
          nickname: t.Optional(t.String({ maxLength: 100 })),
          bio: t.Optional(t.String({ maxLength: 5000 })),
          github: t.Optional(t.String({ pattern: '^https://github\\.com/[A-Za-z0-9_-]+/?$' })),
          linkedin: t.Optional(
            t.String({ pattern: '^https://(www\\.)?linkedin\\.com/in/[A-Za-z0-9_-]+/?$' })
          ),
          publicPrivacy: t.Optional(
            t.Union([t.Literal('full-name'), t.Literal('last-initial'), t.Literal('initials')])
          )
        },
        { additionalProperties: false }
      )
    }
  )
  .delete('/me', async ({ user }) => {
    if (!user) throw status(401);
    return anonymizeUser(user.id, user.id);
  })
  .get(
    '/',
    async ({ user, db, query }) => {
      requirePermission(user, 'users.membership.activate');
      return db
        .select()
        .from(users)
        .limit(50)
        .offset((query.page ?? 0) * 50);
    },
    { query: t.Object({ page: t.Optional(t.Numeric({ minimum: 0, default: 0 })) }) }
  )
  .patch(
    '/:id/access',
    async ({ user, params, body }) => {
      requirePermission(
        user,
        body.flags
          ? 'users.permissions.assign'
          : body.role
            ? 'users.roles.assign'
            : body.membershipStatus === 'active'
              ? 'users.membership.activate'
              : 'users.membership.suspend'
      );
      return manageUser(user!.id, params.id, body);
    },
    {
      body: t.Object(
        {
          role: t.Optional(
            t.Union([t.Literal('member'), t.Literal('board'), t.Literal('administrator')])
          ),
          membershipStatus: t.Optional(
            t.Union([t.Literal('pending'), t.Literal('active'), t.Literal('suspended')])
          ),
          flags: t.Optional(t.Array(t.String(), { maxItems: 100 }))
        },
        { additionalProperties: false }
      )
    }
  )
  .delete('/:id', async ({ user, params }) => {
    requirePermission(user, 'users.accounts.anonymize');
    return anonymizeUser(user!.id, params.id);
  });
