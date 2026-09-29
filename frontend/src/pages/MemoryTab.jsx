import { useEffect, useState } from 'react';
import { api, errMsg } from '../api.js';
import MemoryCard from '../components/MemoryCard.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingState from '../components/LoadingState.jsx';
export default function MemoryTab({ p }) {
  const [d, setD] = useState(null), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  const load = () => { setErr(''); return api.post(`/projects/${p.id}/memories`, {}).then((r) => setD(r.data)).catch((e) => { setErr(errMsg(e)); setD({ memories: [] }); }); };
  useEffect(() => { load(); }, []);
  async function imp() {
    setMsg('');
    try { const r = await api.post(`/projects/${p.id}/import-history`); setMsg(r.data.results.map((x) => `${x.path}: ${x.saved ? 'saved' : 'FAILED — ' + x.error}`).join('\n')); load(); }
    catch (e) { setMsg(errMsg(e)); }
  }
  return (<div className="card"><button className="btn" onClick={imp}>Import history into memory</button>
    <button className="btn alt" onClick={load} style={{ marginLeft: 8 }}>Refresh</button>
    {msg && <pre>{msg}</pre>}<ErrorMessage error={err || d?.memoryError} />
    {!d ? <LoadingState /> : d.memories.length ? d.memories.map((m, i) => <MemoryCard key={i} m={m} i={i} />) : <p>No memories yet. Import history, analyze the project, or record an outcome.</p>}</div>);
}
