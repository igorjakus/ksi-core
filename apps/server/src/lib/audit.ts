import { sql } from 'drizzle-orm';
import { db, auditEvents, outbox } from '../db';
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Executor = typeof db | Transaction;
/** Call inside the same transaction as the mutation. Notifications are delivered only on commit. */
type Event = {
  actorId: string | null;
  projectId?: string | null;
  action: string;
  targetId: string;
  metadata?: Record<string, unknown>;
};
export function recordEvent(
  tx: Transaction,
  event: Event
): Promise<typeof auditEvents.$inferSelect>;
export function recordEvent(
  tx: Transaction,
  actorId: string | null,
  action: string,
  targetId: string,
  projectId?: string | null,
  metadata?: Record<string, unknown>
): Promise<typeof auditEvents.$inferSelect>;
export async function recordEvent(
  tx: Transaction,
  eventOrActor: Event | string | null,
  action?: string,
  targetId?: string,
  projectId: string | null = null,
  metadata: Record<string, unknown> = {}
) {
  const event: Event =
    typeof eventOrActor === 'object' && eventOrActor !== null
      ? eventOrActor
      : { actorId: eventOrActor, action: action!, targetId: targetId!, projectId, metadata };
  const [record] = await tx.insert(auditEvents).values(event).returning();
  if (!record) throw new Error('Audit event could not be recorded');
  await tx.insert(outbox).values({ eventId: record.id });
  await tx.execute(sql`select pg_notify('ksi_outbox', ${record.id})`);
  return record;
}
