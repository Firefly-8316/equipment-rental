import { useAuth } from '../context/AuthContext';
import './Profile.css';

export function Profile() {
  const { user } = useAuth();

  return (
    <div className="page profile-page">
      <h1>My Profile</h1>
      <div className="profile-card">
        <div className="profile-field">
          <span className="profile-label">Name</span>
          <span className="profile-value">{user?.name}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user?.email}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Account type</span>
          <span className={`profile-badge ${user?.role}`}>{user?.role}</span>
        </div>
      </div>
      <p className="profile-note">To update your details, contact the administrator.</p>
    </div>
  );
}
