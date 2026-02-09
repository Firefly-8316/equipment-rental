import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminUsers.css';

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    setError('');
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p className="loading-msg">Loading...</p>;
  if (error && users.length === 0) return <div className="error-msg">{error}</div>;

  return (
    <div className="admin-users">
      <h2>Users</h2>
      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
      {users.length === 0 ? (
        <p className="empty-msg">No users.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td>
                    {u._id === currentUser?._id ? (
                      <span className="current-user">(You)</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={updating === u._id}
                        className="role-select"
                      >
                        <option value="user">user</option>
                        <option value="equipment_manager">equipment_manager</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                    {updating === u._id && <span className="updating-text">Updating...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
