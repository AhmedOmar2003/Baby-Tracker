'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import Spinner from '@/Components/Spinner/Spinner';
import PageTitle from '@/Components/PageTitle/PageTitle';
import doseImage from '../../../assets/images/dose/dose.jpg';

export default function DoseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dose, setDose] = useState(null);
  const [vaccines, setVaccines] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${host}/dose/getAll`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }),
      axios.get(`${host}/vaccine/vaccinesByDoseId/${params.id}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }),
    ])
      .then(([doseRes, vaccineRes]) => {
        const doses = doseRes?.data?.data?.rows || [];
        const nextDose = doses.find((item) => `${item.dose_id}` === `${params.id}`) || null;
        setDose(nextDose);
        setVaccines(vaccineRes?.data?.data?.rows || []);
      })
      .catch((error) => {
        showToast(error?.message || 'Failed to load dose details.', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  const vaccineCount = useMemo(() => vaccines.length, [vaccines]);

  if (loading) {
    return (
      <div className="page-section">
        <div className="container" style={{ textAlign: 'center', padding: '3rem 0' }}>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="page-section dose-details-page">
      <style>{`
        .dose-hero-wrapper {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 24px;
          border: 1px solid rgba(54, 64, 206, 0.1);
          box-shadow: 0 10px 40px rgba(54, 64, 206, 0.05);
          padding: 3rem;
          display: flex;
          align-items: center;
          gap: 3rem;
          margin-bottom: 3rem;
          position: relative;
          overflow: hidden;
        }
        .dose-hero-wrapper::after {
          content: '';
          position: absolute;
          right: -5%;
          top: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(54, 64, 206, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .dose-hero-image-container {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 15px 35px rgba(54, 64, 206, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2px solid rgba(54, 64, 206, 0.05);
          overflow: hidden;
        }
        .dose-hero-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .dose-hero-content {
          flex: 1;
        }
        .dose-hero-title {
          font-size: 2.5rem;
          color: var(--section-head-color);
          font-weight: 900;
          margin-bottom: 0.5rem;
          letter-spacing: -0.5px;
        }
        .dose-hero-desc {
          font-size: 1.1rem;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          max-width: 600px;
        }
        .dose-stats-bar {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .dose-stat-box {
          background: white;
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(54, 64, 206, 0.08);
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .dose-stat-box span.label {
          font-size: 0.85rem;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .dose-stat-box span.val {
          font-size: 1.2rem;
          color: var(--main-color);
          font-weight: 800;
        }
        .vaccines-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .dose-hero-wrapper {
            flex-direction: column;
            text-align: center;
            padding: 2rem;
            gap: 1.5rem;
          }
          .dose-stats-bar {
            justify-content: center;
          }
        }
      `}</style>

      <div className="container">
        <PageTitle
          text="Dose Information"
          subtext="Comprehensive overview of this dose and its associated vaccines."
        />

        <div className="dose-hero-wrapper">
          <div className="dose-hero-image-container">
            <img
              src={dose?.image || doseImage.src}
              alt="Dose Icon"
            />
          </div>
          <div className="dose-hero-content">
            <h1 className="dose-hero-title">{dose?.dose_name || 'Dose Details'}</h1>
            <p className="dose-hero-desc">
              {dose?.description || 'This specific dose is a crucial part of the pediatric vaccination schedule, aimed at building early immunity against various diseases.'}
            </p>
            <div className="dose-stats-bar">
              <div className="dose-stat-box">
                <span className="label">Recommended Age</span>
                <span className="val">{dose?.recommended_age ? `${dose.recommended_age} Months` : 'N/A'}</span>
              </div>
              <div className="dose-stat-box">
                <span className="label">Linked Vaccines</span>
                <span className="val">{vaccineCount} Vaccines</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--section-head-color)', fontWeight: 800, marginBottom: '0.3rem' }}>
              Associated Vaccines
            </h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
              These are the individual vaccines administered during this dose.
            </p>
          </div>
          <Link href="/doses" className="btn-action" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px' }}>
            All Doses
          </Link>
        </div>

        {vaccines.length > 0 ? (
          <div className="vaccines-grid">
            {vaccines.map((item) => (
              <div key={item.vaccine_id} className="ds-list-card" style={{ flexDirection: 'column', padding: '1.5rem', gap: '1rem', border: '1px solid rgba(54,64,206,0.1)' }}>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
                  <img
                    src={item.image || item.image_url || doseImage.src}
                    alt="Vaccine"
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}
                  />
                  <h4 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--section-head-color)', fontWeight: 800 }}>{item.vaccine_name}</h4>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '0.8rem', borderRadius: '10px', width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Age Window</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--section-head-color)', fontWeight: 700 }}>{item.min_age} - {item.max_age} Mo</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Doses Req.</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--section-head-color)', fontWeight: 700 }}>{item.doses_required}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', width: '100%', marginTop: '0.5rem' }}>
                  <Link href={`/vaccines/${item.vaccine_id}`} className="btn-action" style={{ width: '100%', textAlign: 'center', background: 'rgba(54,64,206,0.05)', color: 'var(--main-color)', border: '1px solid rgba(54,64,206,0.1)' }}>
                    View Vaccine Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '4rem 2rem' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>No vaccines have been linked to this dose yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
