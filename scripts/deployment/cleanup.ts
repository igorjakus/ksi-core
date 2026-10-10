/** Cluster-only preview cleanup controller. Run from a Kubernetes CronJob.
 * Credentials are namespace-local; production credentials must never be supplied.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { Client } = createRequire(new URL('../../apps/server/package.json', import.meta.url))('pg');
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const token = (
  await readFile('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8')
).trim();
const ca = await readFile('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt', 'utf8');
const host = `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT}`;
async function kube(path: string, method = 'GET', body?: unknown) {
  return fetch(host + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': method === 'PATCH' ? 'application/merge-patch+json' : 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    tls: { ca }
  });
}
const listing = await kube(
  '/api/v1/namespaces/ksi-preview-data/configmaps?labelSelector=ksi.cleanup%3Dtrue'
);
if (!listing.ok) throw new Error(`Cannot read cleanup queue: ${listing.status}`);
const queue = (await listing.json()) as {
  items: {
    metadata: { name: string; annotations?: Record<string, string> };
    data: { release: string };
  }[];
};
for (const item of queue.items) {
  if (item.metadata.annotations?.['ksi.cleanup-complete'] === 'true') continue;
  const release = JSON.parse(item.data.release) as {
    namespace: string;
    hosts: Record<string, string>;
  };
  const slug = release.namespace.replace(/^ksi-/, '');
  if (!/^[a-z0-9-]+-[a-f0-9]{10}$/.test(slug) || release.namespace === 'ksi-production')
    throw new Error('Unsafe cleanup target');
  const namespace = await kube(`/api/v1/namespaces/${release.namespace}`);
  if (namespace.status !== 404) {
    if (!namespace.ok) throw new Error(`Cannot verify namespace: ${namespace.status}`);
    console.log(`Waiting for namespace pruning: ${slug}`);
    continue;
  }
  const required = [
    'CLOUDFLARE_DNS_TOKEN',
    'CLOUDFLARE_ZONE_ID',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_PRIVATE_BUCKET',
    'R2_PUBLIC_BUCKET',
    'POSTGRES_PASSWORD'
  ];
  for (const key of required)
    if (!process.env[key]) throw new Error(`Cleanup configuration missing ${key}`);
  const db = new Client({
    host: 'preview-postgres',
    user: 'postgres',
    database: 'postgres',
    password: process.env.POSTGRES_PASSWORD
  });
  await db.connect();
  const database = 'ksi_' + slug.replaceAll('-', '_');
  try {
    await db.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    await db.query(`DROP ROLE IF EXISTS "${database}"`);
  } finally {
    await db.end();
  }
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
    }
  });
  // Backend file keys must use this exact namespace prefix; never delete outside it.
  const prefix = `${slug}/`;
  for (const bucket of [process.env.R2_PRIVATE_BUCKET!, process.env.R2_PUBLIC_BUCKET!]) {
    let continuation: string | undefined;
    do {
      const page = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuation
        })
      );
      if (page.Contents?.length) {
        const deleted = await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: page.Contents.map((object) => ({ Key: object.Key! })) }
          })
        );
        if (deleted.Errors?.length) throw new Error('R2 cleanup failed for some objects');
      }
      continuation = page.NextContinuationToken;
    } while (continuation);
  }
  for (const hostname of Object.values(release.hosts)) {
    if (!hostname.startsWith(slug + '-') || !hostname.endsWith('.ksi.edu.pl'))
      throw new Error('Unsafe DNS target');
    const url = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`;
    const headers = { Authorization: `Bearer ${process.env.CLOUDFLARE_DNS_TOKEN}` };
    const response = await fetch(url + '?name=' + encodeURIComponent(hostname), { headers });
    if (!response.ok) throw new Error('DNS cleanup lookup failed');
    const records = (await response.json()) as {
      success: boolean;
      result: { id: string; comment?: string }[];
    };
    if (!records.success) throw new Error('DNS cleanup lookup rejected');
    for (const record of records.result) {
      if (record.comment !== 'KSI preview ' + slug)
        throw new Error('Refusing unmanaged DNS cleanup');
      const deleted = await fetch(url + '/' + record.id, { method: 'DELETE', headers });
      const result = (await deleted.json()) as { success: boolean };
      if (!deleted.ok || !result.success) throw new Error('DNS cleanup failed');
    }
  }
  const updated = await kube(
    `/api/v1/namespaces/ksi-preview-data/configmaps/${item.metadata.name}`,
    'PATCH',
    { metadata: { annotations: { 'ksi.cleanup-complete': 'true' } } }
  );
  if (!updated.ok) throw new Error('Cannot mark cleanup complete');
  console.log(`Preview cleanup completed: ${slug}`);
}
