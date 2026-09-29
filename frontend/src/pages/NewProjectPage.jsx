import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errMsg } from '../api.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
export default function NewProjectPage() {
  const nav = useNavigate();
  const [name, setName] = useState(''), [zip, setZip] = useState(null), [hist, setHist] = useState([]);
  const [pct, setPct] = useState(0), [err, setErr] = useState(''), [res, setRes] = useState(null), [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const fd = new FormData(); fd.append('name', name); fd.append('zip', zip);
    hist.forEach((f) => fd.append('history', f));
    try { setRes((await api.post('/projects', fd, { onUploadProgress: (p) => setPct(Math.round((p.loaded / (p.total || 1)) * 100)) })).data); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  if (res) return (<div className="card"><h3 className="okmsg">Accepted {res.accepted} files</h3>
    {res.skipped.length > 0 && <details><summary>{res.skipped.length} skipped</summary>{res.skipped.map((s, i) => <div key={i}>{s.path} — {s.reason}</div>)}</details>}
    <p><button className="btn" onClick={() => nav(`/p/${res.id}`)}>Open workspace</button></p></div>);
  return (<form className="card" onSubmit={submit}><h2>New project</h2>
    <label htmlFor="n">Project name</label><input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
    <label htmlFor="z">Source ZIP</label><input id="z" type="file" accept=".zip" onChange={(e) => setZip(e.target.files[0])} required />
    <label htmlFor="h">History files (optional, multiple)</label><input id="h" type="file" multiple onChange={(e) => setHist([...e.target.files])} />
    {busy && <p role="status">Uploading… {pct}%</p>}<ErrorMessage error={err} />
    <p><button className="btn" disabled={busy || !zip || !name}>Upload</button></p></form>);
}
