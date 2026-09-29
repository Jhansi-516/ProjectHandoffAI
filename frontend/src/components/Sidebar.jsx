export default function Sidebar({ tabs, active, onSelect }) {
  return (<div className="tabs" role="tablist">{tabs.map((t) =>
    <button key={t} role="tab" aria-selected={t === active} className={t === active ? 'on' : ''} onClick={() => onSelect(t)}>{t}</button>)}</div>);
}
