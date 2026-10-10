import { db } from '../src/db';
import { projects } from '../src/db/schema';
import { createId } from '@paralleldrive/cuid2';

// Run with: bun run apps/server/scripts/import-legacy.ts
async function run() {
  console.log("Importing legacy projects...");
  // Example legacy data mapping
  const legacyProjects = [
    { slug: 'hoc', name: 'Hour of Code', desc: 'Programming workshops for students' },
    { slug: 'ket', name: 'KET', desc: 'Quantum computing algorithms' },
    { slug: 'krasnal', name: 'Krasnal', desc: 'Chess engine' },
    { slug: 'physarum', name: 'Physarum', desc: 'Slime mold behavior' },
    { slug: 'zosia', name: 'ZOSIA', desc: 'Annual winter camp' }
  ];

  for (const lp of legacyProjects) {
    await db.insert(projects).values({
      id: createId(),
      slug: lp.slug,
      name: lp.name,
      description: lp.desc,
      tags: ['legacy']
    }).onConflictDoNothing();
  }
  console.log("Done.");
}

run().catch(console.error);
