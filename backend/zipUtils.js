import fs from 'fs';
import path from 'path';

const SKIP_DIRS = /(^|\/)(node_modules|\.git|dist|build|\.next|coverage|__pycache__)(\/|$)/;
const SECRET = /(^|\/)(\.env[^/]*|.*\.(pem|key|p12)|id_rsa.*|secrets?\.[^/]*)$/i;
const TEXT_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.css', '.html', '.py', '.java', '.yml', '.yaml', '.log', '.csv', '.sql', '.sh', '.toml']);
const HISTORY = /(HANDOVER|PAST_ATTEMPTS|TEST_HISTORY|ATTEMPT|ERROR|CHANGELOG|NOTES)/i;
const MAX_FILE = 300 * 1024;


// Safe write inside a base dir; returns false if the path would escape it.
function safeWrite(base, rel, data) {
  const target = path.resolve(base, rel);
  if (!target.startsWith(path.resolve(base) + path.sep)) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  return true;
}
function accept(name, size) {
  const n = name.replace(/\\/g, '/');
  if (n.startsWith('/') || n.split('/').includes('..') || /^[a-zA-Z]:/.test(n)) return 'unsafe path';
  if (SKIP_DIRS.test(n)) return 'excluded folder';
  if (SECRET.test(n)) return 'secret/env file';
  if (!TEXT_EXT.has(path.extname(n).toLowerCase())) return 'unsupported type';
  if (size > MAX_FILE) return 'too large';
  return null;
}

export { SKIP_DIRS, SECRET, TEXT_EXT, HISTORY, MAX_FILE, safeWrite, accept };
