import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, errMsg } from '../api.js';
import Sidebar from '../components/Sidebar.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import OverviewTab from './OverviewTab.jsx';
import AgentTab from './AgentTab.jsx';
import FilesTab from './FilesTab.jsx';
import MemoryTab from './MemoryTab.jsx';
import ChangesTab from './ChangesTab.jsx';
const TABS = ['Overview', 'Ask the Agent', 'Project Files', 'Memory & History', 'Generated Changes'];
export default function WorkspacePage() {
  const { id } = useParams();
  const [p, setP] = useState(null), [tab, setTab] = useState(TABS[0]), [err, setErr] = useState('');
  const load = () => api.get(`/projects/${id}`).then((r) => setP(r.data)).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, [id]);
  if (err) return <ErrorMessage error={err} />;
  if (!p) return <LoadingState />;
  const props = { p, reload: load };
  return (<div><h2>{p.name} <span className="badge">{p.status}</span></h2>
    <Sidebar tabs={TABS} active={tab} onSelect={setTab} />
    {tab === TABS[0] && <OverviewTab {...props} />}{tab === TABS[1] && <AgentTab {...props} />}
    {tab === TABS[2] && <FilesTab {...props} />}{tab === TABS[3] && <MemoryTab {...props} />}
    {tab === TABS[4] && <ChangesTab {...props} />}</div>);
}
