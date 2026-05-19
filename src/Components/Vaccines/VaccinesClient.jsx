'use client';

import '../../app/vaccines/vaccine.css';
import '@/app/articles/articles.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import Spinner from '@/Components/Spinner/Spinner';
import Link from 'next/link';
import vaccineImage from '../../assets/images/vaccine/vaccine.png';
import { useRouter } from 'next/navigation';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { getLikedIds, toggleFavorite } from '@/lib/favoritesManager';

export default function VaccinesClient() {
  const [activeTab, setActiveTab] = useState(true);
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likedIds, setLikedIds] = useState([]);
  const router = useRouter();
  const cacheKey = 'vaccines_cache_v2';

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
    toggleFavorite('vaccines', item, 'vaccine_id');
    setLikedIds(getLikedIds('vaccines', 'vaccine_id'));
  };

  // Fetch once on mount — tab filtering is client-side
  useEffect(() => {
    const token = localStorage.getItem('Token');
    if (!token) {
      showToast('You are not logged in.', 'warning');
      router.push('/signin');
      return;
    }

    setLikedIds(getLikedIds('vaccines', 'vaccine_id'));

    const cached = sessionStorage.getItem(cacheKey);
    const hasCached = !!cached;
    if (cached) {
      setData(normalizeRows(JSON.parse(cached)));
    }
    if (!hasCached) setLoading(true);

    axios
      .get(`${host}/vaccine/getAll`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .then((response) => {
        const rows = normalizeRows(response.data.data.rows || []);
        setData(rows);
        sessionStorage.setItem(cacheKey, JSON.stringify(rows));
      })
      .catch((error) => {
        if (!hasCached) showToast(getErrorMessage(error, 'Failed to load vaccines.'), 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  // Tab filtering is instant — no API call needed
  useEffect(() => {
    setFilterData(data.filter((item) => item.is_mandatory === activeTab));
  }, [activeTab, data]);

  return (
    <div className="viccine page-section">
      <div className="container">
        <PageTitle text="Vaccines" subtext="Explore basic and additional vaccines for your child." />
        <div style={{ margin: '0 0 1.25rem', padding: '1rem 1.25rem', borderRadius: '18px', background: '#f6f8ff', border: '1px solid #e2e8ff', color: '#2a336a' }}>
          This page is the vaccine reference for moms: it explains what each vaccine is, when it is needed, and how many doses are required.
        </div>
        <div className="page-tabs">
          <button
            className={activeTab ? 'active-tab' : ''}
            onClick={() => setActiveTab(true)}
          >
            Basic
          </button>
          <button
            className={!activeTab ? 'active-tab' : ''}
            onClick={() => setActiveTab(false)}
          >
            Additional
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
        ) : (
          <div className="content">
            {filterData.length > 0 ? (
              <div>
                {filterData.map((item) => (
                  <div key={item.vaccine_id} className="ds-list-card">
                    <img
                      src={item.image || vaccineImage.src}
                      alt="Vaccine Image"
                      className="ds-list-img"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="ds-list-body">
                      <h4>{item.vaccine_name}</h4>
                      <p>
                        Status:{' '}
                        <span className="meta-text">
                          {item.is_mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      </p>
                      <p>
                        Age window:{' '}
                        <span className="meta-text">
                          {item.min_age} - {item.max_age} Months
                        </span>
                      </p>
                      <p>
                        Doses required:{' '}
                        <span className="meta-text">{item.doses_required}</span>
                      </p>
                    </div>
                    <div className="ds-list-actions">
                      {likedIds.includes(item.vaccine_id)
                        ? <MdFavorite className="heart-icon liked" onClick={() => handleClickHeart(item)} />
                        : <MdFavoriteBorder className="heart-icon" onClick={() => handleClickHeart(item)} />
                      }
                      <Link href={`/vaccines/${item.vaccine_id}`} className="btn-action">
                        Read More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No vaccines found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
