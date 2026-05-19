'use client';
import './BannerDoctor.css';
import { useEffect, useState } from 'react';
import doctorImage from '../../../assets/images/doctor/doctor.png';
import { MdFavorite, MdFavoriteBorder, MdStar } from 'react-icons/md';
import axios from 'axios';
import Link from 'next/link';

import PageTitle from '@/Components/PageTitle/PageTitle.jsx';
import Spinner from '@/Components/Spinner/Spinner';
import { showToast } from '@/Components/Toast/Toast';
import { useRouter } from 'next/navigation';

import { getLikedIds, toggleFavorite } from '@/lib/favoritesManager';

export default function Banner({ host }) {
  const [data, setData] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const cacheKey = 'doctors_cache_v2';

  const normalizeRows = (rows) =>
    (Array.isArray(rows) ? rows : []).map((row) => ({
      ...row,
      image_url: row?.image_url || row?.image || null,
    }));

  //Show Doctor
  useEffect(() => {
    let token = localStorage.getItem('Token');
    if (!token) {
      showToast(`You are not logged in.`, 'warning');
      router.push('/signin');
      return;
    }

    setLikedIds(getLikedIds('doctors', 'user_id'));

    const cached = sessionStorage.getItem(cacheKey);
    const hasCached = !!cached;
    if (cached) {
      setData(normalizeRows(JSON.parse(cached)));
    }
    if (!hasCached) setLoading(true);

    axios
      .get(host, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .then((res) => {
        const rows = normalizeRows(res.data.data.rows);
        setData(rows);
        sessionStorage.setItem(cacheKey, JSON.stringify(rows));
      })
      .catch((error) => {
        if (!hasCached) showToast(`Connection error: ${error.message}`, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [host]);

  const handleClickHeart = (item) => {
    toggleFavorite('doctors', item, 'user_id');
    setLikedIds(getLikedIds('doctors', 'user_id'));
  };

  return (
    <div className="doctor">
      <div>
        <PageTitle text="Our Dedicated Doctors" subtext="Find and connect with top-rated pediatricians and specialists." />
        {loading ? (
          <Spinner />
        ) : (
          <div className="content page-section">
            <div className="container">
              <div>
                {data.map((item, index) => {
                  return (
                    <div className="ds-list-card" key={item.user_id}>
                      <img
                        src={item.image_url || doctorImage.src}
                        alt="Doctor Image"
                        className="ds-list-img"
                      />
                      <div className="ds-list-body">
                        <h4>{`${item.first_name} ${item.last_name}`}</h4>
                        <p>{item.specialization}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '0.4rem' }}>
                          <span style={{ color: '#FFD700', fontSize: '1.2rem' }}><MdStar /></span>
                          <span className="meta-text">{item.rating ? Number(item.rating).toFixed(1) : '4.5'} Rating</span>
                        </div>
                      </div>
                      <div className="ds-list-actions">
                        {likedIds.includes(item.user_id)
                          ? <MdFavorite className="heart-icon liked" onClick={() => handleClickHeart(item)} />
                          : <MdFavoriteBorder className="heart-icon" onClick={() => handleClickHeart(item)} />
                        }
                        <Link href={`/doctors/${item.user_id}`} className="btn-action">
                          View Profile
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
