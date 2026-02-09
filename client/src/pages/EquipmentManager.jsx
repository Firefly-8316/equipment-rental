import { NavLink, Outlet } from 'react-router-dom';
import './EquipmentManager.css';

export function EquipmentManager() {
  return (
    <div className="page equipment-manager-page">
      <h1>Equipment Manager Dashboard</h1>
      <nav className="em-nav">
        <NavLink to="." end>Overview</NavLink>
        <NavLink to="equipment">Equipment</NavLink>
        <NavLink to="bookings">Bookings</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
