import { createId } from '@paralleldrive/cuid2';
import {
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  snakeCase,
  jsonb,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core';

export const membershipStatusEnum = pgEnum('membership_status', [
  'pending',
  'active',
  'suspended',
  'deleted'
]);
export const memberRoleEnum = pgEnum('member_role', ['member', 'board', 'administrator']);
export const privacyEnum = pgEnum('public_privacy', ['full-name', 'last-initial', 'initials']);

export const users = snakeCase.table('users', {
  id: text().primaryKey().$defaultFn(createId),
  name: text().notNull(),
  firstName: text().notNull().default(''),
  lastName: text().notNull().default(''),
  nickname: text(),
  bio: text(),
  github: text(),
  linkedin: text(),
  publicPrivacy: privacyEnum().notNull().default('last-initial'),
  membershipStatus: membershipStatusEnum().notNull().default('pending'),
  role: memberRoleEnum().notNull().default('member'),
  flags: text().array().notNull().default([]),
  deletedAt: timestamp(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  createdAt: timestamp()
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull()
});

export const sessions = snakeCase.table('sessions', {
  id: text().primaryKey().$defaultFn(createId),
  expiresAt: timestamp().notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp()
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
});

export const accounts = snakeCase.table('accounts', {
  id: text().primaryKey().$defaultFn(createId),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  createdAt: timestamp()
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp()
    .$onUpdate(() => new Date())
    .notNull()
});

export const verifications = snakeCase.table('verifications', {
  id: text().primaryKey().$defaultFn(createId),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp()
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull()
});

export const alertStyleEnum = pgEnum('alert_color', ['neutral', 'info', 'warning', 'danger']);

export const alerts = snakeCase.table('alerts', {
  id: text().primaryKey().$defaultFn(createId),
  priority: integer(),
  title: text().notNull(),
  description: text().notNull(),
  link: text(),
  color: alertStyleEnum().notNull(),
  startDate: timestamp().notNull(),
  endDate: timestamp().notNull(),
  createdBy: text().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp()
    .$defaultFn(() => new Date())
    .notNull()
});

export const projects = snakeCase.table('projects', {
  id: text().primaryKey().$defaultFn(createId),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text().notNull().default(''),
  tags: text().array().notNull().default([]),
  fields: text().array().notNull().default([]),
  locked: boolean().notNull().default(false),
  layout: jsonb()
    .$type<
      { type: 'leaders' | 'members' | 'main-article' | 'articles' | 'links'; hidden: boolean }[]
    >()
    .notNull()
    .default([]),
  version: integer().notNull().default(1),
  createdAt: timestamp().notNull().defaultNow()
});
export const projectMembers = snakeCase.table(
  'project_members',
  {
    id: text().primaryKey().$defaultFn(createId),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    userId: text()
      .notNull()
      .references(() => users.id),
    leader: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow()
  },
  (t) => [uniqueIndex('project_member_unique').on(t.projectId, t.userId)]
);
export const joinRequests = snakeCase.table(
  'join_requests',
  {
    id: text().primaryKey().$defaultFn(createId),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    userId: text()
      .notNull()
      .references(() => users.id),
    state: text().notNull().default('pending'),
    createdAt: timestamp().notNull().defaultNow()
  },
  (t) => [uniqueIndex('join_request_unique').on(t.projectId, t.userId)]
);
export const projectLinks = snakeCase.table('project_links', {
  id: text().primaryKey().$defaultFn(createId),
  projectId: text()
    .notNull()
    .references(() => projects.id),
  label: text().notNull(),
  url: text().notNull(),
  position: integer().notNull().default(0)
});
export const articles = snakeCase.table('articles', {
  id: text().primaryKey().$defaultFn(createId),
  projectId: text().references(() => projects.id),
  slug: text().notNull().unique(),
  title: text().notNull(),
  markdown: text().notNull().default(''),
  language: text().notNull().default('pl'),
  state: text().notNull().default('draft'),
  mainArticle: boolean().notNull().default(false),
  projectFeed: boolean().notNull().default(false),
  websiteFeed: boolean().notNull().default(false),
  version: integer().notNull().default(1),
  createdBy: text()
    .notNull()
    .references(() => users.id),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
});
export const articleRevisions = snakeCase.table(
  'article_revisions',
  {
    id: text().primaryKey().$defaultFn(createId),
    articleId: text()
      .notNull()
      .references(() => articles.id),
    version: integer().notNull(),
    title: text().notNull(),
    markdown: text().notNull(),
    actorId: text()
      .notNull()
      .references(() => users.id),
    createdAt: timestamp().notNull().defaultNow()
  },
  (t) => [uniqueIndex('article_revision_unique').on(t.articleId, t.version)]
);
export const articleProposals = snakeCase.table('article_proposals', {
  id: text().primaryKey().$defaultFn(createId),
  articleId: text()
    .notNull()
    .references(() => articles.id),
  authorId: text()
    .notNull()
    .references(() => users.id),
  baseVersion: integer().notNull(),
  title: text().notNull(),
  markdown: text().notNull(),
  state: text().notNull().default('pending'),
  createdAt: timestamp().notNull().defaultNow()
});
export const articleContributors = snakeCase.table(
  'article_contributors',
  {
    id: text().primaryKey().$defaultFn(createId),
    articleId: text()
      .notNull()
      .references(() => articles.id),
    userId: text()
      .notNull()
      .references(() => users.id),
    publicCredit: boolean().notNull().default(false)
  },
  (t) => [uniqueIndex('article_contributor_unique').on(t.articleId, t.userId)]
);
export const boards = snakeCase.table('boards', {
  id: text().primaryKey().$defaultFn(createId),
  projectId: text().references(() => projects.id),
  scopeKey: text().notNull().unique(),
  tags: text().array().notNull().default([])
});
export const kanbanItems = snakeCase.table('kanban_items', {
  id: text().primaryKey().$defaultFn(createId),
  boardId: text()
    .notNull()
    .references(() => boards.id),
  title: text().notNull(),
  markdown: text().notNull().default(''),
  column: text().notNull().default('todo'),
  tags: text().array().notNull().default([]),
  position: integer().notNull().default(0),
  version: integer().notNull().default(1),
  deletedAt: timestamp(),
  authorId: text()
    .notNull()
    .references(() => users.id),
  createdAt: timestamp().notNull().defaultNow()
});
export const threads = snakeCase.table('threads', {
  id: text().primaryKey().$defaultFn(createId),
  projectId: text().references(() => projects.id),
  title: text().notNull(),
  visibility: text().notNull().default('association'),
  invitedIds: text().array().notNull().default([]),
  authorId: text()
    .notNull()
    .references(() => users.id),
  archivedAt: timestamp(),
  version: integer().notNull().default(1),
  createdAt: timestamp().notNull().defaultNow()
});
export const comments = snakeCase.table('comments', {
  id: text().primaryKey().$defaultFn(createId),
  threadId: text().references(() => threads.id),
  itemId: text().references(() => kanbanItems.id),
  authorId: text()
    .notNull()
    .references(() => users.id),
  markdown: text().notNull(),
  deletedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow()
});
export const files = snakeCase.table(
  'files',
  {
    id: text().primaryKey().$defaultFn(createId),
    hash: text().notNull(),
    objectKey: text().notNull().unique(),
    filename: text().notNull(),
    mime: text().notNull(),
    size: integer().notNull(),
    environment: text().notNull(),
    uploaderId: text()
      .notNull()
      .references(() => users.id),
    state: text().notNull().default('private'),
    orphanedAt: timestamp().defaultNow(),
    createdAt: timestamp().notNull().defaultNow()
  },
  (t) => [index('file_hash').on(t.environment, t.hash)]
);
export const fileReferences = snakeCase.table(
  'file_references',
  {
    id: text().primaryKey().$defaultFn(createId),
    fileId: text()
      .notNull()
      .references(() => files.id),
    ownerType: text().notNull(),
    ownerId: text().notNull(),
    public: boolean().notNull().default(false)
  },
  (t) => [uniqueIndex('file_reference_unique').on(t.fileId, t.ownerType, t.ownerId)]
);
export const auditEvents = snakeCase.table('audit_events', {
  id: text().primaryKey().$defaultFn(createId),
  actorId: text().references(() => users.id),
  projectId: text().references(() => projects.id),
  action: text().notNull(),
  targetId: text().notNull(),
  metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp().notNull().defaultNow()
});
export const outbox = snakeCase.table('outbox', {
  id: text().primaryKey().$defaultFn(createId),
  eventId: text()
    .notNull()
    .references(() => auditEvents.id),
  deliveredAt: timestamp(),
  attempts: integer().notNull().default(0),
  createdAt: timestamp().notNull().defaultNow()
});
export const authHandoffs = snakeCase.table('auth_handoffs', {
  id: text().primaryKey(),
  sessionId: text()
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  environment: text().notNull(),
  destination: text().notNull(),
  state: text().notNull(),
  challenge: text().notNull(),
  expiresAt: timestamp().notNull()
});
export const frontendSessions = snakeCase.table('frontend_sessions', {
  id: text().primaryKey(),
  sessionId: text()
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  origin: text().notNull(),
  environment: text().notNull(),
  expiresAt: timestamp().notNull()
});
export const mailJobs = snakeCase.table('mail_jobs', {
  id: text().primaryKey().$defaultFn(createId),
  to: text().notNull(),
  subject: text().notNull(),
  body: text().notNull(),
  attempts: integer().notNull().default(0),
  availableAt: timestamp().notNull().defaultNow(),
  sentAt: timestamp()
});
