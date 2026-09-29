import MemoryCard from './MemoryCard.jsx';
export default function ChatMessage({ m }) {
  return (<div className={`msg ${m.role}`}>{m.content}
    {m.role === 'assistant' && m.memories && <details open><summary>Recalled memories ({m.memories.length})</summary>
      {m.memoryError && <p className="err">Memory unavailable: {m.memoryError}</p>}
      {m.memories.length ? m.memories.map((x, i) => <MemoryCard key={i} m={x} i={i} />) : <p>No memories recalled.</p>}</details>}</div>);
}
