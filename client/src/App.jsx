import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GuestOnly } from './components/GuestOnly';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Equipment } from './pages/Equipment';
import { Bookings } from './pages/Bookings';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { AdminDashboard } from './pages/AdminDashboard';
import { EquipmentManager } from './pages/EquipmentManager';
import { EMOverview } from './pages/EMOverview';
import { EMEquipment } from './pages/EMEquipment';
import { EMBookings } from './pages/EMBookings';
import { AdminEquipment } from './pages/AdminEquipment';
import { AdminBookings } from './pages/AdminBookings';
import { AdminUsers } from './pages/AdminUsers';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route
            path="/equipment"
            element={
              <ProtectedRoute userOnly>
                <Equipment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute userOnly>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="equipment" element={<AdminEquipment />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          <Route
            path="/equipment-manager"
            element={
              <ProtectedRoute equipmentManagerOnly>
                <EquipmentManager />
              </ProtectedRoute>
            }
          >
            <Route index element={<EMOverview />} />
            <Route path="equipment" element={<EMEquipment />} />
            <Route path="bookings" element={<EMBookings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
