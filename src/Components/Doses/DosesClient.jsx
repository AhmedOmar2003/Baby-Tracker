'use client';

import { useEffect, useState } from 'react';
import '../../app/doses/doses.css';
import PageTitle from '@/Components/PageTitle/PageTitle';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import Spinner from '@/Components/Spinner/Spinner';
import doseImage from '../../assets/images/dose/dose.jpg';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DosesClient() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const cacheKey = 'doses_cache_v2';

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

  const fetchDoses = async () => {
    const token = localStorage.getItem('Token');
    if (!token) {
      showToast('You are not logged in.', 'warning');
      router.push('/signin');
      return;
    }

    const cached = sessionStorage.getItem(cacheKey);
    const hasCached = !!cached;
    if (cached) {
      setData(normalizeRows(JSON.parse(cached)));
    }
    if (!hasCached) setLoading(true);

    try {
      const response = await axios.get(`${host}/dose/getAll`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      const rows = normalizeRows(response.data.data.rows || []);
      setData(rows);
      sessionStorage.setItem(cacheKey, JSON.stringify(rows));
    } catch (error) {
      if (!hasCached) showToast(getErrorMessage(error, 'Failed to load doses.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm) {
      fetchDoses();
      return;
    }
    const filteredData = data.filter((dose) =>
      `${dose.dose_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredData.length === 0) {
      showToast('No doses found matching your search.', 'warning');
    }
    setData(filteredData);
  };

  useEffect(() => {
    fetchDoses();
  }, []);

  return (
    <div className="allDoses page-section">
      <div className="container">
        <PageTitle
          text="Vaccination Doses"
          subtext="Use this page as the reminder roadmap for your child's vaccine schedule."
        />
        <div className="page-search">
          <input
            type="text"
            placeholder="Search for a dose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={handleSearch}
            className="ds-input"
          />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
        ) : (
          <div className="content">
            {data.length === 0 ? (
              <div className="empty-state">
                <p>No doses available.</p>
              </div>
            ) : (
              <div>
                {data.map((item) => (
                  <div key={item.dose_id} className="ds-list-card">
                    <img
                      src={item.image || doseImage.src}
                      alt="Dose Image"
                      className="ds-list-img"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="ds-list-body">
                      <h4>{item.dose_name}</h4>
                      <p>
                        Age: <span className="meta-text">{item.recommended_age} Months</span>
                      </p>
                      <p>{item.description || 'Recommended pediatric vaccination dose.'}</p>
                    </div>
                    <div className="ds-list-actions" style={{ justifyContent: 'center' }}>
                      <Link href={`/doses/${item.dose_id}`} className="btn-action">
                        View Linked Vaccines
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
