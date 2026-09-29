import * as hs from './hindsight.js';
import { read } from './storage.js';

// Keep the context small enough to leave room for the prompt and answer.
// Character count is only an estimate of tokens, so use a conservative cap.
function context(m, query, limit = 14000) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);

  const score = (f) =>
    (f.kind === 'history' ? 1000 : 0) +
    (/package\.json|readme/i.test(f.path) ? 500 : 0) +
    words.filter((w) => f.path.toLowerCase().includes(w)).length * 50 +
    (f.path.includes('src/') ? 20 : 0);

  let out = '';
  const files = [...m.files].sort((a, b) => score(b) - score(a));

  for (const f of files) {
    const header = `\n=== FILE: ${f.path} (${f.kind}) ===\n`;
    const content = String(read(m, f) ?? '');
    const remaining = limit - out.length;

    if (remaining <= header.length) break;

    // Reserve space for a note if the file needs to be shortened.
    const contentRoom = remaining - header.length;
    const block =
      content.length <= contentRoom
        ? header + content + '\n'
        : header +
          content.slice(0, Math.max(0, contentRoom - 40)) +
          '\n...[file shortened to fit context limit]\n';

    out += block;

    if (out.length >= limit) break;
  }

  return out;
}

async function recallSafe(m, q) {
  try {
    return { memories: await hs.recall(m.id, q), memoryError: null };
  } catch (e) {
    return { memories: [], memoryError: e.message };
  }
}

const memText = (ms) =>
  ms.length
    ? ms.map((x, i) => `[M${i + 1}] (${x.type}) ${x.text}`).join('\n')
    : '(none recalled)';

const parseJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    throw new Error('LLM did not return valid JSON; try again');
  }
};

export { context, recallSafe, memText, parseJson };