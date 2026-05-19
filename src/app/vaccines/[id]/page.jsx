'use client';
import './vaccineDetails.css';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import Spinner from '@/Components/Spinner/Spinner';
import vaccineImage from '../../../assets/images/vaccine/vaccine.png';
import { MdArrowBack, MdInfo, MdOutlineVaccines } from 'react-icons/md';

export default function VaccineDetails() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    axios
      .get(`${host}/vaccine/vaccineById/${params.id}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .then((res) => { setData(res.data.data.rows[0]); setLoading(false); })
      .catch((err) => { showToast(err.message, 'error'); setLoading(false); });
  }, [params.id]);

  if (loading || !data) {
    return <div className="loading"><Spinner /></div>;
  }

  return (
    <div className="vaccine-detail-page page-section">
      <div className="container" style={{ maxWidth: '820px' }}>

        <button className="vac-back-btn" onClick={() => router.back()}>
          <MdArrowBack /> Back to Vaccines
        </button>

        {/* Hero */}
        <div className="vac-hero-card">
          <div className="vac-image-wrap">
            <img
              src={data.image || data.image_url || vaccineImage.src}
              alt={data.vaccine_name}
            />
          </div>

          <div className="vac-hero-info">
            <div className="vac-badges">
              <span className={`vac-badge ${data.is_mandatory ? 'vac-badge-mandatory' : 'vac-badge-optional'}`}>
                {data.is_mandatory ? 'Mandatory' : 'Optional'}
              </span>
            </div>

            <h1 className="vac-name">{data.vaccine_name}</h1>

            <div className="vac-stats-grid">
              <div className="vac-stat">
                <span className="vac-stat-label">Doses Required</span>
                <span className="vac-stat-value">{data.doses_required}</span>
              </div>
              <div className="vac-stat">
                <span className="vac-stat-label">Min Age</span>
                <span className="vac-stat-value">{data.min_age} months</span>
              </div>
              <div className="vac-stat">
                <span className="vac-stat-label">Max Age</span>
                <span className="vac-stat-value">{data.max_age} months</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="vac-info-card">
          <h3 className="vac-section-title"><MdInfo /> About this Vaccine</h3>
          <p className="vac-description">
            {data.description || 'No detailed description available for this vaccine.'}
          </p>
        </div>

      </div>
    </div>
  );
}
