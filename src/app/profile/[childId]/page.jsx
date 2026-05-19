'use client';
import './childDetails.css';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import Spinner from '@/Components/Spinner/Spinner';
import { MdBoy, MdGirl, MdEdit, MdArrowBack, MdVaccines, MdScale, MdHeight, MdCake, MdCheckCircle, MdPending, MdCalendarToday, MdChildCare } from 'react-icons/md';

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const years = now.getFullYear() - dob.getFullYear();
  const months = now.getMonth() - dob.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 1) return 'Less than a month';
  if (totalMonths < 12) return `${totalMonths} month${totalMonths > 1 ? 's' : ''}`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y} yr${y > 1 ? 's' : ''} ${m} mo` : `${y} year${y > 1 ? 's' : ''}`;
}

export default function ChildId() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [childRes, dosesRes] = await Promise.allSettled([
          axios.get(`${host}/child/childById/${params.childId}`, {
            headers: { 'Content-Type': 'application/json' },
          }),
          axios.get(`${host}/dose/childDoses/${params.childId}`, {
            headers: { 'Content-Type': 'application/json' },
          }),
        ]);

        if (childRes.status === 'fulfilled') {
          setData(childRes.value.data.data.rows[0]);
        } else {
          showToast('Failed to load child data.', 'error');
        }

        if (dosesRes.status === 'fulfilled') {
          setDoses(dosesRes.value.data.data.rows || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [params.childId]);

  const completedDoses = doses.filter((d) => d.status === 'Completed').length;
  const pendingDoses = doses.filter((d) => d.status !== 'Completed').length;
  const nextDose = doses.find((d) => d.status !== 'Completed');
  const vaccinationRate = doses.length > 0 ? Math.round((completedDoses / doses.length) * 100) : 0;

  const isFemale = data?.gender === 'Female';

  return (
    <div className="child-details-page">
      <div className="container">
        {loading ? (
          <Spinner />
        ) : data ? (
          <div className="child-card-wrapper">

            {/* ── Header / Hero ── */}
            <div className={`child-hero ${isFemale ? 'female-hero' : 'male-hero'}`}>
              <div className="hero-avatar">
                {isFemale
                  ? <MdGirl className="hero-gender-icon female" />
                  : <MdBoy  className="hero-gender-icon male"   />
                }
              </div>
              <div className="hero-text">
                <h1 className="child-name">{data.first_name} {data.last_name}</h1>
                <span className={`gender-pill ${isFemale ? 'female' : 'male'}`}>
                  {data.gender}
                </span>
              </div>
            </div>

            {/* ── Stats grid ── */}
            <div className="stats-grid">
              <div className="stat-card">
                <MdCake className="stat-icon age" />
                <div>
                  <p className="stat-label">Age</p>
                  <p className="stat-value">{calculateAge(data.date_of_birth) ?? '—'}</p>
                </div>
              </div>
              <div className="stat-card">
                <MdScale className="stat-icon weight" />
                <div>
                  <p className="stat-label">Weight</p>
                  <p className="stat-value">{data.weight ?? '—'} <span className="stat-unit">kg</span></p>
                </div>
              </div>
              <div className="stat-card">
                <MdHeight className="stat-icon height" />
                <div>
                  <p className="stat-label">Height</p>
                  <p className="stat-value">{data.height ?? '—'} <span className="stat-unit">cm</span></p>
                </div>
              </div>
              <div className="stat-card">
                <MdCalendarToday className="stat-icon dob" />
                <div>
                  <p className="stat-label">Date of Birth</p>
                  <p className="stat-value small">{data.date_of_birth?.slice(0, 10) ?? '—'}</p>
                </div>
              </div>
            </div>

            {/* ── Vaccination summary ── */}
            <div className="vaccination-section">
              <h2 className="section-title">
                <MdVaccines className="section-icon" /> Vaccination Summary
              </h2>

              {doses.length === 0 ? (
                <p className="no-doses">No vaccination records found yet.</p>
              ) : (
                <>
                  <div className="progress-bar-wrapper">
                    <div className="progress-labels">
                      <span>{completedDoses} completed</span>
                      <span>{vaccinationRate}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${vaccinationRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="dose-stats">
                    <div className="dose-stat completed">
                      <MdCheckCircle className="dose-stat-icon" />
                      <span>{completedDoses} Done</span>
                    </div>
                    <div className="dose-stat pending">
                      <MdPending className="dose-stat-icon" />
                      <span>{pendingDoses} Pending</span>
                    </div>
                    {nextDose && (
                      <div className="dose-stat next">
                        <MdCalendarToday className="dose-stat-icon" />
                        <span>Next: {nextDose.dose_name}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Action buttons ── */}
            <div className="child-actions">
              <Link href="/profile" className="action-link back-link">
                <MdArrowBack /> Back
              </Link>
              <Link
                href={`/profile/${params.childId}/editForm/${params.childId}`}
                className="action-link edit-link"
              >
                <MdEdit /> Edit Profile
              </Link>
              <Link
                href={`/profile/childDosesByChildId/${params.childId}`}
                className="action-link doses-link"
              >
                <MdVaccines /> View Doses
              </Link>
            </div>

          </div>
        ) : (
          <div className="not-found">
            <MdChildCare />
            <p>Child not found.</p>
            <Link href="/profile">Back to Profile</Link>
          </div>
        )}
      </div>
    </div>
  );
}
