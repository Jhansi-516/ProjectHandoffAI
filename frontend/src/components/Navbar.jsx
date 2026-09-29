import { Link } from 'react-router-dom';
export default function Navbar() {
  return <header className="top"><Link to="/">ProjectHandoff AI</Link><nav><Link to="/dashboard">Dashboard</Link></nav></header>;
}
