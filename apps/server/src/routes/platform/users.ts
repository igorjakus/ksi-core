import { validProfileLink } from 'shared/profile-links';
import { status, t } from 'elysia';
import { eq, and, or, ilike, asc, count } from 'drizzle-orm';
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
      for (const provider of ['github', 'linkedin'] as const)
        if (!validProfileLink(provider, body[provider]))
          throw status(422, {
            code: provider === 'github' ? 'INVALID_GITHUB_URL' : 'INVALID_LINKEDIN_URL',
            message:
              provider === 'github'
                ? 'Use a https://github.com/username profile link.'
                : 'Use a https://linkedin.com/in/username profile link.'
          });
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
          github: t.Optional(t.Union([t.Null(), t.String({ maxLength: 300 })])),
          linkedin: t.Optional(t.Union([t.Null(), t.String({ maxLength: 300 })])),
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
      const pattern = query.search ? `%${query.search.replace(/[\\%_]/g, '\\$&')}%` : undefined;
      const where = and(
        query.role ? eq(users.role, query.role) : undefined,
        query.status ? eq(users.membershipStatus, query.status) : undefined,
        pattern
          ? or(
              ilike(users.name, pattern),
              ilike(users.email, pattern),
              ilike(users.nickname, pattern)
            )
          : undefined
      );
      const [records, totals] = await Promise.all([
        db
          .select()
          .from(users)
          .where(where)
          .orderBy(asc(users.name), asc(users.id))
          .limit(50)
          .offset((query.page ?? 0) * 50),
        db.select({ total: count() }).from(users).where(where)
      ]);
      return { users: records, total: totals[0]!.total };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 0, maximum: 100000, multipleOf: 1 })),
        search: t.Optional(t.String({ maxLength: 200 })),
        role: t.Optional(
          t.Union([t.Literal('member'), t.Literal('board'), t.Literal('administrator')])
        ),
        status: t.Optional(
          t.Union([
            t.Literal('pending'),
            t.Literal('active'),
            t.Literal('suspended'),
            t.Literal('deleted')
          ])
        )
      })
    }
  )
  .get('/:id', async ({ user, db, params }) => {
    requirePermission(user, 'users.membership.activate');
    const [member] = await db.select().from(users).where(eq(users.id, params.id));
    if (!member) throw status(404, { code: 'USER_NOT_FOUND' });
    return member;
  })
  .patch(
    '/:id/profile',
    async ({ user, db, params, body }) => {
      const actor = requirePermission(user, 'users.members.manage-profile');
      if (actor.role !== 'administrator') throw status(403, { code: 'FORBIDDEN' });
      for (const provider of ['github', 'linkedin'] as const)
        if (!validProfileLink(provider, body[provider]))
          throw status(422, { code: `INVALID_${provider.toUpperCase()}_URL` });
      return db.transaction(async (tx) => {
        const [currentActor] = await tx
          .select()
          .from(users)
          .where(eq(users.id, actor.id))
          .for('share');
        requirePermission(currentActor ?? null, 'users.members.manage-profile');
        if (currentActor?.role !== 'administrator') throw status(403, { code: 'FORBIDDEN' });
        const [member] = await tx.select().from(users).where(eq(users.id, params.id)).for('update');
        if (!member) throw status(404, { code: 'USER_NOT_FOUND' });
        if (member.membershipStatus === 'deleted') throw status(409, { code: 'ACCOUNT_DELETED' });
        const [updated] = await tx
          .update(users)
          .set({
            ...body,
            name:
              [body.firstName ?? member.firstName, body.lastName ?? member.lastName]
                .filter(Boolean)
                .join(' ') || member.name
          })
          .where(eq(users.id, params.id))
          .returning();
        const [event] = await tx
          .insert(auditEvents)
          .values({
            actorId: actor.id,
            targetId: params.id,
            action: 'users.profile.updated',
            metadata: { fields: Object.keys(body) }
          })
          .returning();
        await tx.insert(outbox).values({ eventId: event!.id });
        return updated;
      });
    },
    {
      body: t.Object(
        {
          firstName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
          lastName: t.Optional(t.String({ maxLength: 100 })),
          nickname: t.Optional(t.String({ maxLength: 100 })),
          bio: t.Optional(t.String({ maxLength: 5000 })),
          github: t.Optional(t.Union([t.Null(), t.String({ maxLength: 300 })])),
          linkedin: t.Optional(t.Union([t.Null(), t.String({ maxLength: 300 })]))
        },
        { additionalProperties: false }
      )
    }
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
