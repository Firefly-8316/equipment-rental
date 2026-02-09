import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookModal } from '../components/BookModal';
import { EquipmentDetailModal } from '../components/EquipmentDetailModal';
import './Equipment.css';

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

export function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [detailEquipment, setDetailEquipment] = useState(null);
  const [bookingEquipment, setBookingEquipment] = useState(null);

  const fetchEquipment = async () => {
    setLoading(true);
    setError('');
    try {
      const url = showAvailableOnly ? '/equipment?available=true' : '/equipment';
      const data = await api.get(url);
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
  }, [showAvailableOnly]);

  const categories = [...new Set(equipment.map((e) => e.category))].sort();
  let filtered = categoryFilter
    ? equipment.filter((e) => e.category === categoryFilter)
    : equipment;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter((e) =>
      e.name.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
    );
  }
  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.rentalPrice - b.rentalPrice;
      if (sortBy === 'price-desc') return b.rentalPrice - a.rentalPrice;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }

  const handleBookingSuccess = () => {
    fetchEquipment();
    setDetailEquipment(null);
  };

  const openBook = (item) => {
    setDetailEquipment(null);
    setBookingEquipment(item);
  };

  return (
    <div className="page equipment-page">
      <h1>Equipment</h1>
      <div className="equipment-filters">
        <input
          type="search"
          placeholder="Search equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="filter-search"
        />
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={(e) => setShowAvailableOnly(e.target.checked)}
          />
          Available only
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="loading-msg">Loading...</p>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <p className="empty-msg">No equipment found.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="equipment-grid">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="equipment-card"
              onClick={() => setDetailEquipment(item)}
              onKeyDown={(e) => e.key === 'Enter' && setDetailEquipment(item)}
              role="button"
              tabIndex={0}
            >
              <div className="equipment-image">
                {item.imageURL ? (
                  <img src={item.imageURL} alt={item.name} />
                ) : (
                  <div className="equipment-placeholder">No image</div>
                )}
              </div>
              <div className="equipment-info">
                <span className="equipment-category">{item.category}</span>
                <h3>{item.name}</h3>
                <p className="equipment-desc">{item.description || 'No description.'}</p>
                <p className="equipment-price">₹{item.rentalPrice} / day</p>
                <span className={`equipment-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                  {item.isAvailable ? 'Available' : 'Booked'}
                </span>
                <button
                  type="button"
                  className="btn-book"
                  disabled={!item.isAvailable}
                  onClick={(e) => { e.stopPropagation(); openBook(item); }}
                >
                  {item.isAvailable ? 'Book' : 'Not Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailEquipment && (
        <EquipmentDetailModal
          equipment={detailEquipment}
          onClose={() => setDetailEquipment(null)}
          onBook={openBook}
        />
      )}
      {bookingEquipment && (
        <BookModal
          equipment={bookingEquipment}
          onClose={() => setBookingEquipment(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
