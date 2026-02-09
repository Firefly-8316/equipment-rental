import { NavLink, Outlet } from 'react-router-dom';
import './Admin.css';

export function Admin() {
  return (
    <div className="page admin-page">
      <h1>Admin Dashboard</h1>
      <nav className="admin-nav">
        <NavLink to="." end>Dashboard</NavLink>
        <NavLink to="equipment">Equipment</NavLink>
        <NavLink to="bookings">Bookings</NavLink>
        <NavLink to="users">Users</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
