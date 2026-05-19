'use client';
import { useState, useEffect } from 'react';
import { MdFavorite } from 'react-icons/md';
import Link from 'next/link';
import { getFavorites, toggleFavorite, clearFavorites } from '@/lib/favoritesManager';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import './favorites.css';

export default function Favorites() {
  const [filter, setFilter] = useState('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [favorites, setFavorites] = useState({
    doctors: [],
    medicines: [],
    vaccines: [],
    articles: []
  });

  const loadAllFavorites = () => {
    setFavorites({
      doctors: getFavorites('doctors'),
      medicines: getFavorites('medicines'),
      vaccines: getFavorites('vaccines'),
      articles: getFavorites('articles')
    });
  };

  useEffect(() => {
    loadAllFavorites();
  }, []);

  const handleRemove = (category, item, idKey) => {
    toggleFavorite(category, item, idKey);
    loadAllFavorites();
  };

  const handleClearAll = () => setShowClearModal(true);

  const executeClearAll = () => {
    setShowClearModal(false);
    if (filter === 'all') {
      clearFavorites();
    } else {
      clearFavorites(filter);
    }
    loadAllFavorites();
    showToast('Favorites cleared successfully.', 'success');
  };

  const getFilteredData = () => {
    if (filter === 'all') {
      return [
        ...favorites.doctors.map(item => ({ ...item, _category: 'doctors', _idKey: 'user_id', _link: `/doctors/${item.user_id}` })),
        ...favorites.medicines.map(item => ({ ...item, _category: 'medicines', _idKey: '_id', _link: `/medicine/medicineById/${item._id}` })),
        ...favorites.vaccines.map(item => ({ ...item, _category: 'vaccines', _idKey: 'vaccine_id', _link: `/vaccines/${item.vaccine_id}` })),
        ...favorites.articles.map(item => ({ ...item, _category: 'articles', _idKey: '_id', _link: `/articles/${item._id}` }))
      ];
    }
    const idKeyMap = { doctors: 'user_id', medicines: '_id', vaccines: 'vaccine_id', articles: '_id' };
    const linkMap = { doctors: '/doctors/', medicines: '/medicine/medicineById/', vaccines: '/vaccines/', articles: '/articles/' };
    
    return favorites[filter].map(item => ({ 
      ...item, 
      _category: filter, 
      _idKey: idKeyMap[filter],
      _link: `${linkMap[filter]}${item[idKeyMap[filter]]}`
    }));
  };

  const displayData = getFilteredData();

  const getTitle = (item) => {
    if (item._category === 'doctors') return `${item.first_name} ${item.last_name}`;
    if (item._category === 'medicines') return item.name;
    if (item._category === 'vaccines') return item.vaccine_name;
    if (item._category === 'articles') return item.title;
    return 'Unknown';
  };

  const getDesc = (item) => {
    if (item._category === 'doctors') return item.specialization;
    if (item._category === 'medicines') return item.category;
    if (item._category === 'vaccines') return `Doses: ${item.doses_required}`;
    if (item._category === 'articles') return item.status;
    return '';
  };

  const getImage = (item) => {
    return item.image_url || item.image || '/default-medicine.svg';
  };

  return (
    <div className="profile-favorites-section">
      <div className="favorites-header">
        <h2>My Favorites</h2>
        {displayData.length > 0 && (
          <button className="btn-clear-all" onClick={handleClearAll}>Clear All</button>
        )}
      </div>

      <div className="favorites-filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="fav-dropdown">
          <option value="all">All Favorites</option>
          <option value="doctors">Doctors</option>
          <option value="medicines">Medicines</option>
          <option value="vaccines">Vaccines</option>
          <option value="articles">Articles</option>
        </select>
      </div>

      <div className="favorites-content">
        {displayData.length === 0 ? (
          <div className="empty-state">
            <p>No favorites found in this category.</p>
          </div>
        ) : (
          <div className="favorites-grid">
            {displayData.map((item, index) => (
              <div key={`${item._category}-${index}`} className="ds-list-card fav-card">
                <img
                  src={getImage(item)}
                  alt="Thumbnail"
                  className="ds-list-img fav-img"
                  style={{ objectFit: 'cover' }}
                />
                <div className="ds-list-body">
                  <h4>{getTitle(item)}</h4>
                  <p>{getDesc(item)}</p>
                  <span className="fav-badge">{item._category}</span>
                </div>
                <div className="ds-list-actions">
                  <MdFavorite
                    className="heart-icon liked"
                    onClick={() => handleRemove(item._category, item, item._idKey)}
                    title="Remove from favorites"
                  />
                  <Link href={item._link} className="btn-action">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showClearModal}
        title="Clear Favorites"
        message={filter === 'all' ? 'Are you sure you want to clear all favorites?' : `Are you sure you want to clear all ${filter} favorites?`}
        confirmText="Yes, Clear"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={executeClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
}
