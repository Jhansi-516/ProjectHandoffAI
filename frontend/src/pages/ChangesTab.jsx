import { useState } from 'react';
import { api, errMsg } from '../api.js';
import FileTree from '../components/FileTree.jsx';
import CodeViewer from '../components/CodeViewer.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
export default function ChangesTab({ p, reload }) {
  const [task, setTask] = useState(p.lastRequest || ''), [g, setG] = useState(p.generation), [busy, setBusy] = useState(false);
  const [err, setErr] = useState(''), [sel, setSel] = useState(null), [notes, setNotes] = useState(''), [fb, setFb] = useState('');
  async function gen() { setBusy(true); setErr(''); try { setG((await api.post(`/projects/${p.id}/generate`, { message: task })).data); reload(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } }
  async function outcome(result) { try { await api.post(`/projects/${p.id}/outcome`, { result, notes }); setFb('Outcome saved to memory.'); reload(); } catch (e) { setFb('NOT saved: ' + errMsg(e)); } }
  return (<div>
    <div className="card"><label htmlFor="t">What should be generated?</label><textarea id="t" rows={3} value={task} onChange={(e) => setTask(e.target.value)} />
      <p><button className="btn" onClick={gen} disabled={busy || !task}>{busy ? 'Generating…' : 'Generate updated project'}</button></p><ErrorMessage error={err} /></div>
    {g && <div className="card"><h3>Summary</h3><p>{g.summary}</p>{g.howToTest && <p><b>How to test:</b> {g.howToTest}</p>}
      {g.rejected?.length > 0 && <p className="err">Rejected unsafe/invalid paths: {g.rejected.join(', ')}</p>}
      <div className="files"><FileTree files={g.files} selected={sel?.path} onSelect={setSel} />
        <div>{sel && <p><i>{sel.reason}</i></p>}<CodeViewer path={sel?.path} content={sel?.content} /></div></div>
      <p><a className="btn" href={`/api/projects/${p.id}/download`}>Download generated ZIP</a></p>
      <h3>After testing</h3><label htmlFor="nt">Notes (optional)</label><textarea id="nt" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <p><button className="btn" onClick={() => outcome('worked')}>Worked</button> <button className="btn alt" onClick={() => outcome('failing')}>Still failing</button></p>{fb && <p role="status">{fb}</p>}</div>}</div>);
}
