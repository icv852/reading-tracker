import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/books" className="navbar-brand">Reading Tracker</Link>
      {user && (
        <div className="navbar-right">
          <span className="navbar-user">{user.email}</span>
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      )}
    </nav>
  );
}
