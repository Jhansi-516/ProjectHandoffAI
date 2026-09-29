// All Hindsight calls live here.
import { HindsightClient } from '@vectorize-io/hindsight-client';

let client;

export const configured = () => !!process.env.HINDSIGHT_API_KEY;

const bank = (id) =>
  `${process.env.BANK_PREFIX || 'projecthandoff-demo'}-${id}`;

function get() {
  if (!configured()) {
    throw new Error(
      'Hindsight is not configured: set HINDSIGHT_API_KEY in backend/.env'
    );
  }

  client ??= new HindsightClient({
    baseUrl: process.env.HINDSIGHT_BASE_URL,
    apiKey: process.env.HINDSIGHT_API_KEY,
  });

  return client;
}

// Ensure this project's memory bank exists before using it.
async function ensureBank(c, projectId) {
  const bankId = bank(projectId);

  if (typeof c.createBank !== 'function') {
    throw new Error(
      'Installed Hindsight client has no createBank(); check the installed package version'
    );
  }

  await c.createBank(bankId, {
    name: `ProjectHandoff project ${projectId}`,
    background:
      'Remember project handover details, codebase architecture, previous attempts, test outcomes, and lessons learned for this project.',
  });

  return bankId;
}

export async function retain(projectId, content, context) {
  const c = get();

  if (typeof c.retain !== 'function') {
    throw new Error(
      'Installed Hindsight client has no retain(); check the installed package'
    );
  }

  const bankId = await ensureBank(c, projectId);

  return c.retain(
    bankId,
    content,
    context ? { context } : undefined
  );
}

export async function recall(projectId, query) {
  const c = get();

  if (typeof c.recall !== 'function') {
    throw new Error(
      'Installed Hindsight client has no recall(); check the installed package'
    );
  }

  const bankId = await ensureBank(c, projectId);
  const r = await c.recall(bankId, query);

  const list = Array.isArray(r)
    ? r
    : r?.results || r?.memories || [];

  return list.map((m) => ({
    text: m.text || m.content || String(m),
    type: m.type || m.fact_type || 'memory',
    context: m.context || null,
  }));
}