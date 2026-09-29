import { useState } from 'react';
import { api, errMsg } from '../api.js';
export default function OverviewTab({ p, reload }) {
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  const a = p.analysis;
  async function run() {
    setBusy(true); setMsg('');
    try { const r = await api.post(`/projects/${p.id}/analyze`); setMsg(r.data.saved ? 'Analysis saved to memory.' : `Analysis done, but NOT saved to memory: ${r.data.saveError}`); reload(); }
    catch (e) { setMsg(errMsg(e)); } finally { setBusy(false); }
  }
  return (<div className="card"><button className="btn" onClick={run} disabled={busy}>{busy ? 'Analyzing…' : 'Analyze project'}</button>{msg && <p role="status">{msg}</p>}
    <p>{p.files.length} files accepted, {p.skipped?.length || 0} skipped.</p>
    {a ? <><h3>{a.type}</h3><p>{a.summary}</p><h4>Known features</h4><ul>{a.features?.map((f, i) => <li key={i}>{f}</li>)}</ul>
      <h4>Known issues & past failed attempts</h4><ul>{a.issues?.map((f, i) => <li key={i}>{f}</li>)}</ul></> : <p>Not analyzed yet.</p>}</div>);
}
