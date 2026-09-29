import fs from 'fs';
import path from 'path';

export const ROOT = path.resolve('data', 'projects');
fs.mkdirSync(ROOT, { recursive: true });

const dir = (id) => path.join(ROOT, id);
const metaPath = (id) => path.join(dir(id), 'meta.json');
const load = (id) => {
  if (!/^[a-f0-9-]{36}$/.test(id) || !fs.existsSync(metaPath(id))) return null;
  return JSON.parse(fs.readFileSync(metaPath(id), 'utf8'));
};
const save = (m) => fs.writeFileSync(metaPath(m.id), JSON.stringify(m, null, 2));
const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => res.status(500).json({ error: e.message }));
const withProject = (fn) => wrap((req, res) => {
  const m = load(req.params.projectId);
  return m ? fn(req, res, m) : res.status(404).json({ error: 'Project not found' });
});

const list = (m) => m.files.map(({ id, path: p, size, kind }) => ({ id, path: p, size, kind }));
const read = (m, f, sub = 'original') => fs.readFileSync(path.join(dir(m.id), sub, f.path), 'utf8');


export { dir, metaPath, load, save, wrap, withProject, list, read };
