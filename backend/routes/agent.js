import express from 'express';
import fs from 'fs';
import path from 'path';

import * as hs from '../hindsight.js';
import { chat } from '../llm.js';
import { dir, save, withProject, read } from '../storage.js';
import { accept, safeWrite } from '../zipUtils.js';
import {
  context,
  recallSafe,
  memText,
  parseJson,
} from '../projectAnalyzer.js';

const router = express.Router();

// Limit the amount of memory text included in an LLM request.
function limitedMemText(memories, limit = 2000) {
  return memText(memories).slice(0, limit);
}

// Keep only recent, valid chat turns and limit their length.
function recentHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        ['user', 'assistant'].includes(item.role) &&
        typeof item.content === 'string'
    )
    .slice(-4)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 1000),
    }));
}

// Analyze the uploaded project.
router.post(
  '/api/projects/:projectId/analyze',
  withProject(async (_req, res, m) => {
    const { memories, memoryError } = await recallSafe(
      m,
      'project purpose, architecture, features, past failures'
    );

    const out = parseJson(
      await chat(
        [
          {
            role: 'system',
            content:
              'You analyze codebases from evidence only. Say "unknown" where evidence is missing. Return JSON: {"type":string,"summary":string,"features":[string],"issues":[string]} where issues are known issues/failed attempts found in the history or memories.',
          },
          {
            role: 'user',
            content: `RECALLED MEMORIES:
${limitedMemText(memories)}

PROJECT FILES:
${context(m, 'overview', 6000)}`,
          },
        ],
        true
      )
    );

    m.analysis = out;
    m.status = 'analyzed';
    save(m);

    let saved = false;
    let saveError = null;

    try {
      await hs.retain(
        m.id,
        `Project "${m.name}" (${out.type}): ${out.summary} Features: ${(out.features || []).join('; ')}`,
        'project-overview'
      );
      saved = true;
    } catch (e) {
      saveError = e.message;
    }

    res.json({
      analysis: out,
      memories,
      memoryError,
      saved,
      saveError,
    });
  })
);

// Chat with the project agent.
router.post(
  '/api/projects/:projectId/chat',
  withProject(async (req, res, m) => {
    const q =
      typeof req.body.message === 'string'
        ? req.body.message.trim()
        : '';

    if (!q) {
      return res.status(400).json({ error: 'message is required' });
    }

    const { memories, memoryError } = await recallSafe(m, q);

    const history = recentHistory(req.body.history);
    const memoryContext = limitedMemText(memories, 2000);
    const fileContext = context(m, q, 5000);

    const answer = await chat([
      {
        role: 'system',
        content:
          'You are ProjectHandoff AI, helping a developer understand and change an existing project. Rules: ground claims in the provided files, history and recalled memories; never invent evidence; never claim code was run or tested; never treat an untested suggestion as a confirmed fix. Structure the answer in Markdown with these sections when relevant: "## Recorded facts" (cite file names or [M#] memory ids), "## Hypotheses & suggestions" (clearly your inference), "## Past attempts & outcomes" (what not to repeat and why), "## Risks & files likely to change", "## Implementation plan". Do not write full code unless asked to generate.',
      },

      ...history,

      {
        role: 'user',
        content: `RECALLED MEMORIES:
${memoryContext}

PROJECT FILES:
${fileContext}

QUESTION:
${q}`,
      },
    ]);

    if (/add|fix|error|implement|generate|upgrade/i.test(q) && !/^now generate/i.test(q)) {
      m.lastRequest = q;
    }

    save(m);

    res.json({
      answer,
      memories,
      memoryError,
    });
  })
);

// Retrieve project memories for the Memory & History tab.
router.post(
  '/api/projects/:projectId/memories',
  withProject(async (req, res, m) => {
    const query =
      typeof req.body.query === 'string' && req.body.query.trim()
        ? req.body.query.trim()
        : 'past attempts, errors, outcomes';

    const { memories, memoryError } = await recallSafe(m, query);

    res.json({
      memories,
      memoryError,
    });
  })
);

// Import handover/history documents into Hindsight memory.
router.post(
  '/api/projects/:projectId/import-history',
  withProject(async (_req, res, m) => {
    const docs = m.files.filter((file) => file.kind === 'history');

    if (!docs.length) {
      return res.status(400).json({
        error: 'No history documents in this project',
      });
    }

    const results = [];

    for (const file of docs) {
      try {
        const content = String(read(m, file) ?? '').slice(0, 12000);

        await hs.retain(
          m.id,
          `History document ${file.path}:
${content}`,
          'imported-history'
        );

        results.push({
          path: file.path,
          saved: true,
        });
      } catch (e) {
        results.push({
          path: file.path,
          saved: false,
          error: e.message,
        });
      }
    }

    res.json({ results });
  })
);

// Record whether a generated change worked or failed.
router.post(
  '/api/projects/:projectId/outcome',
  withProject(async (req, res, m) => {
    const { result, notes = '' } = req.body;

    if (!['worked', 'failing'].includes(result)) {
      return res.status(400).json({
        error: 'result must be "worked" or "failing"',
      });
    }

    const generation = m.generation;

    const text =
      `OUTCOME (${result === 'worked' ? 'SUCCESS' : 'FAILURE'}) ` +
      `for request: "${m.lastRequest || 'unknown'}". ` +
      `Change summary: ${generation?.summary || 'no generated change recorded'}. ` +
      `Files changed: ${
        (generation?.files || []).map((file) => file.path).join(', ') || 'n/a'
      }. ` +
      `User test notes: ${String(notes).slice(0, 2000) || 'none'}.`;

    await hs.retain(m.id, text, 'test-outcome');

    m.status = result === 'worked' ? 'verified' : 'needs-work';
    save(m);

    res.json({ saved: true });
  })
);

// Generate a separate upgraded copy of the project.
router.post(
  '/api/projects/:projectId/generate',
  withProject(async (req, res, m) => {
    const message =
      typeof req.body.message === 'string'
        ? req.body.message
        : '';

    const q = (message || m.lastRequest || '').trim();

    if (!q) {
      return res.status(400).json({
        error: 'Describe what to generate',
      });
    }

    m.lastRequest = q;

    const { memories, memoryError } = await recallSafe(m, q);

    const out = parseJson(
      await chat(
        [
          {
            role: 'system',
            content:
              'You modify an existing project. Preserve existing behavior. Avoid approaches recorded as failed in memories/history. Return JSON: {"summary":string,"howToTest":string,"files":[{"path":string,"content":string (FULL file content),"reason":string}]}. Use relative paths only. If the task is large, deliver a coherent first increment and say so in summary.',
          },
          {
            role: 'user',
            content: `RECALLED MEMORIES:
${limitedMemText(memories, 2000)}

PROJECT FILES:
${context(m, q, 10000)}

TASK:
${q}`,
          },
        ],
        true
      )
    );

    const generatedDir = path.join(dir(m.id), 'generated');

    fs.rmSync(generatedDir, {
      recursive: true,
      force: true,
    });

    fs.cpSync(
      path.join(dir(m.id), 'original'),
      generatedDir,
      { recursive: true }
    );

    const written = [];
    const rejected = [];

    for (const file of out.files || []) {
      const relativePath = String(file.path || '').replace(/\\/g, '/');
      const content = String(file.content || '');

      if (
        accept(relativePath, Buffer.byteLength(content)) ||
        !safeWrite(generatedDir, relativePath, content)
      ) {
        rejected.push(relativePath);
      } else {
        written.push({
          path: relativePath,
          reason: file.reason,
          content,
        });
      }
    }

    m.generation = {
      summary: out.summary,
      howToTest: out.howToTest,
      files: written,
      rejected,
      at: new Date().toISOString(),
    };

    m.status = 'generated';
    save(m);

    res.json({
      ...m.generation,
      memories,
      memoryError,
    });
  })
);

export default router;