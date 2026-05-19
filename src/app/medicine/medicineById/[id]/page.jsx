'use client';
import './medicineDetails.css';
import { host } from '@/Components/utils/Host';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { showToast } from '@/Components/Toast/Toast';
import Spinner from '@/Components/Spinner/Spinner';
import {
  MdArrowBack, MdMedication, MdInfo, MdWarning, MdLocalPharmacy,
} from 'react-icons/md';

export default function MedicineDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${host}/medicine/medicineById/${params.id}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .then((res) => { setData(res.data.data.rows[0]); setLoading(false); })
      .catch((err) => { showToast(err.message, 'error'); setLoading(false); });
  }, [params.id]);

  if (loading || !data) {
    return <div className="loading"><Spinner /></div>;
  }

  const sideEffects = Array.isArray(data.sideEffects) ? data.sideEffects : [];

  return (
    <div className="medicine-detail-page page-section">
      <div className="container" style={{ maxWidth: '820px' }}>

        <button className="med-back-btn" onClick={() => router.back()}>
          <MdArrowBack /> Back to Medicines
        </button>

        {/* Hero */}
        <div className="med-hero-card">
          <div className="med-image-wrap">
            <img
              src={data.image || data.image_url || '/default-medicine.svg'}
              alt={data.name}
            />
          </div>

          <div className="med-hero-info">
            <div className="med-badges">
              {data.category && <span className="med-badge med-badge-category">{data.category}</span>}
              <span className={`med-badge ${data.prescriptionRequired ? 'med-badge-rx' : 'med-badge-otc'}`}>
                {data.prescriptionRequired ? 'Prescription Required' : 'Over the Counter'}
              </span>
            </div>

            <h1 className="med-name">{data.name}</h1>
            {data.manufacturer && <p className="med-manufacturer">by {data.manufacturer}</p>}

            <div className="med-meta-grid">
              {data.price != null && (
                <div className="med-meta-item">
                  <span className="med-meta-label">Price</span>
                  <span className="med-meta-value price">{data.price} EGP</span>
                </div>
              )}
              {data.dosage && (
                <div className="med-meta-item">
                  <span className="med-meta-label">Dosage</span>
                  <span className="med-meta-value">{data.dosage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="med-info-card">
            <h3 className="med-section-title"><MdInfo /> About this Medicine</h3>
            <p className="med-description">{data.description}</p>
          </div>
        )}

        {/* Side Effects */}
        {sideEffects.length > 0 && (
          <div className="med-info-card">
            <h3 className="med-section-title"><MdWarning /> Possible Side Effects</h3>
            <ul className="med-side-effects-list">
              {sideEffects.map((effect, idx) => <li key={idx}>{effect}</li>)}
            </ul>
          </div>
        )}

        {/* Dosage instructions */}
        {data.dosage && (
          <div className="med-info-card">
            <h3 className="med-section-title"><MdLocalPharmacy /> Dosage Instructions</h3>
            <p className="med-dosage-text"><MdMedication /> {data.dosage}</p>
          </div>
        )}

      </div>
    </div>
  );
}
