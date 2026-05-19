import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🏛️</span>
          <span className="brand-accent">Tainan</span>
        </NavLink>
        <ul className="navbar-links">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
              📊 <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>
              ➕ <span>Add</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
              📋 <span>History</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
