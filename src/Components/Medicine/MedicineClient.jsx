'use client';

import { useEffect, useState } from 'react';
import '../../app/articles/articles.css';
import '../../app/medicine/medicine.css';
import PageTitle from '@/Components/PageTitle/PageTitle';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import Spinner from '@/Components/Spinner/Spinner';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getLikedIds, toggleFavorite } from '@/lib/favoritesManager';

export default function MedicineClient() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchSideEffect, setSearchSideEffect] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likedIds, setLikedIds] = useState([]);
  const router = useRouter();
  const cacheKey = 'medicine_cache_v2';

  const normalizeRows = (rows) =>
    (Array.isArray(rows) ? rows : []).map((row) => ({
      ...row,
      image: row?.image || row?.image_url || null,
    }));

  const getErrorMessage = (error, fallback = 'Something went wrong') =>
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;

  const handleClickHeart = (item) => {
    toggleFavorite('medicines', item, '_id');
    setLikedIds(getLikedIds('medicines', '_id'));
  };

  const fetchAllData = async () => {
    const cached = sessionStorage.getItem(cacheKey);
    const hasCached = !!cached;
    if (cached) setData(normalizeRows(JSON.parse(cached)));
    if (!hasCached) setLoading(true);

    try {
      const response = await axios.get(`${host}/medicine/getAll`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      const rows = normalizeRows(response?.data?.data?.rows || []);
      setData(rows);
      sessionStorage.setItem(cacheKey, JSON.stringify(rows));
    } catch (error) {
      if (!hasCached) showToast(getErrorMessage(error, 'Failed to load medicines.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const searchData = async () => {
    if (!searchName && !searchCategory && !searchSideEffect) {
      showToast('Please enter something to search.', 'warning');
      return;
    }

    try {
      setSearching(true);

      const response = await axios.get(`${host}/medicine/search`, {
        params: {
          name: searchName || undefined,
          category: searchCategory || undefined,
          sideEffects: searchSideEffect || undefined,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      const rows = normalizeRows(response?.data?.data?.rows || []);

      setData(rows);

      if (rows.length === 0) {
        showToast('No medicines found matching your search.', 'warning');
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to search medicines.'), 'error');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('Token');
    if (token) {
      setIsLoggedIn(true);
      fetchAllData();
      setLikedIds(getLikedIds('medicines', '_id'));
    } else {
      showToast('You are not logged in.', 'warning');
      router.push('/signin');
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const delayDebounce = setTimeout(() => {
      if (!searchName && !searchCategory && !searchSideEffect) {
        fetchAllData();
      } else {
        searchData();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchName, searchCategory, searchSideEffect, isLoggedIn]);

  return (
    <div className="medicine page-section">
      <div className="container">
        <PageTitle text="Medications" subtext="Browse through essential pediatric medicines and check their categories." />
        {isLoggedIn && (
          <div className="page-search" style={{ maxWidth: '800px', flexWrap: 'wrap', gap: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <input
              type="text"
              placeholder="Search By Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="ds-input"
            />
            <input
              type="search"
              placeholder="Search By Category"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="ds-input"
            />
            <input
              type="search"
              placeholder="Search By Side Effect"
              value={searchSideEffect}
              onChange={(e) => setSearchSideEffect(e.target.value)}
              className="ds-input"
            />
          </div>
        )}
        {loading ? (
          <Spinner />
        ) : isLoggedIn ? (
          <div className="content">
            {searching ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
            ) : data.length > 0 ? (
              <div>
                {data.map((item) => (
                  <div key={item._id} className="ds-list-card">
                    <img
                      src={item.image || '/default-medicine.svg'}
                      alt="Medicine Image"
                      className="ds-list-img"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="ds-list-body">
                      <h4>{item.name}</h4>
                      <p>Category: <span className="meta-text">{item.category}</span></p>
                    </div>
                    <div className="ds-list-actions">
                      {likedIds.includes(item._id)
                        ? <MdFavorite className="heart-icon liked" onClick={() => handleClickHeart(item)} />
                        : <MdFavoriteBorder className="heart-icon" onClick={() => handleClickHeart(item)} />
                      }
                      <Link href={`/medicine/medicineById/${item._id}`} className="btn-action">
                        Read More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No medicines found.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
