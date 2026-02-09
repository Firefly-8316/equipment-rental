import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './EMEquipment.css';

const emptyForm = { name: '', description: '', rentalPrice: '', category: 'General', imageURL: '', isAvailable: true, condition: 'Good', conditionNotes: '', penaltyPerDay: '' };

export function EMEquipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/equipment');
      setEquipment(data);
    } catch (err) {
      setError(err.message || 'Failed to load equipment');
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      rentalPrice: String(item.rentalPrice),
      category: item.category || 'General',
      imageURL: item.imageURL || '',
      isAvailable: item.isAvailable,
      condition: item.condition || 'Good',
      conditionNotes: item.conditionNotes || '',
      penaltyPerDay: item.penaltyPerDay ? String(item.penaltyPerDay) : '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        rentalPrice: Number(form.rentalPrice),
        category: form.category,
        imageURL: form.imageURL,
        isAvailable: form.isAvailable,
        condition: form.condition || 'Good',
        conditionNotes: form.conditionNotes || '',
        penaltyPerDay: Number(form.penaltyPerDay) || 0,
      };
      if (editing) {
        await api.put(`/equipment/${editing._id}`, payload);
      } else {
        await api.post('/equipment', payload);
      }
      fetchEquipment();
      closeForm();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/equipment/${id}`);
      fetchEquipment();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  if (loading) return <p className="loading-msg">Loading...</p>;
  if (error && !showForm) return <div className="error-msg">{error}</div>;

  return (
    <div className="em-equipment">
      <div className="em-equipment-header">
        <h2>Equipment</h2>
        <button type="button" className="btn-add" onClick={openAdd}>
          + Add Equipment
        </button>
      </div>

      {showForm && (
        <div className="em-form-overlay" onClick={closeForm}>
          <div className="em-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Edit Equipment' : 'Add Equipment'}</h3>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <label>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <label>Rental Price (₹/day) *</label>
              <input type="number" min="0" step="0.01" value={form.rentalPrice} onChange={(e) => setForm({ ...form, rentalPrice: e.target.value })} required />
              <label>Late Return Penalty (₹/day)</label>
              <input type="number" min="0" step="0.01" value={form.penaltyPerDay} onChange={(e) => setForm({ ...form, penaltyPerDay: e.target.value })} placeholder="0" />
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Construction, Event" />
              <label>Image URL</label>
              <input type="url" value={form.imageURL} onChange={(e) => setForm({ ...form, imageURL: e.target.value })} placeholder="https://..." />
              <label>Condition</label>
              <select value={form.condition || 'Good'} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                <option value="Good">Good</option>
                <option value="Damaged">Damaged</option>
                <option value="Unavailable">Unavailable</option>
              </select>
              <label>Condition Notes</label>
              <textarea value={form.conditionNotes || ''} onChange={(e) => setForm({ ...form, conditionNotes: e.target.value })} rows={2} placeholder="Damage details, maintenance notes..." />
              <label className="checkbox-label">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
                Available
              </label>
              <div className="form-actions">
                <button type="button" onClick={closeForm}>Cancel</button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Condition</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.length === 0 ? (
              <tr><td colSpan={6}>No equipment. Add your first item.</td></tr>
            ) : (
              equipment.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>₹{item.rentalPrice}/day</td>
                  <td>
                    <span className={`condition-badge ${(item.condition || 'Good').toLowerCase()}`}>
                      {item.condition || 'Good'}
                    </span>
                  </td>
                  <td>{item.isAvailable ? 'Yes' : 'No'}</td>
                  <td>
                    <button type="button" className="btn-edit" onClick={() => openEdit(item)}>Edit</button>
                    <button type="button" className="btn-delete" onClick={() => handleDelete(item._id, item.name)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
