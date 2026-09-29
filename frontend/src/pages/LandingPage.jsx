import { Link } from 'react-router-dom';
const STEPS = ['Upload project', 'Understand history', 'Analyze', 'Generate upgrade', 'Learn from outcome'];
export default function LandingPage() {
  return (<div><h1>ProjectHandoff AI</h1>
    <p>An agent that helps new team members understand an existing codebase — and learns from past successes and failures before suggesting changes.</p>
    <Link className="btn" to="/new">Create project workspace</Link>
    <div className="steps">{STEPS.map((s, i) => <span key={s}>{i + 1}. {s}</span>)}</div></div>);
}
