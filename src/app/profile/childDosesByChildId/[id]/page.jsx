'use client';
import './childDoses.css';
import Spinner from '@/Components/Spinner/Spinner';
import { showToast } from '@/Components/Toast/Toast';
import { host } from '@/Components/utils/Host';
import axios from 'axios';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { normalizeStoredUserIds } from '@/lib/userIdentity';
import {
  MdCheckCircle, MdWarning, MdNotifications, MdSchedule,
  MdArrowBack, MdOutlineVaccines, MdCalendarToday,
  MdMedicalServices, MdPerson, MdLocalHospital, MdCancel,
} from 'react-icons/md';

/* ─── helpers ─────────────────────────────────────────── */
function getAgeInMonths(dob) {
  if (!dob) return 0;
  const birth = new Date(dob);
  const now   = new Date();
  return Math.max(0,
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth()    - birth.getMonth())
  );
}

function formatAge(months) {
  if (months < 1)  return 'Newborn';
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}m` : `${y} year${y !== 1 ? 's' : ''}`;
}

function calcScheduledDate(recommendedAge, dob) {
  if (!dob) return new Date().toISOString().slice(0, 10);
  const birth     = new Date(dob);
  const scheduled = new Date(birth);
  scheduled.setMonth(scheduled.getMonth() + (recommendedAge || 0));
  const today = new Date();
  return (scheduled < today ? today : scheduled).toISOString().slice(0, 10);
}

/* overdue > 2 months past | due within ±2 months window | upcoming */
function inferStatus(recommendedAge, childAgeMonths) {
  const diff = childAgeMonths - (recommendedAge ?? 0);
  if (diff > 2)  return 'overdue';
  if (diff >= -2) return 'due';
  return 'upcoming';
}

const STATUS_META = {
  completed: { label: 'Completed',  cls: 'vt-completed', Icon: MdCheckCircle   },
  overdue:   { label: 'Overdue',    cls: 'vt-overdue',   Icon: MdWarning       },
  due:       { label: 'Due Now',    cls: 'vt-due',       Icon: MdNotifications },
  upcoming:  { label: 'Upcoming',   cls: 'vt-upcoming',  Icon: MdSchedule      },
  cancelled: { label: 'Cancelled',  cls: 'vt-cancelled', Icon: MdCancel        },
};

const SORT_ORDER = { overdue: 0, due: 1, upcoming: 2, completed: 3, cancelled: 4 };

/* ─── component ───────────────────────────────────────── */
export default function ChildDosesByChildId() {
  const params = useParams();
  const router = useRouter();

  const [child,   setChild]   = useState(null);
  const [doses,   setDoses]   = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null); // dose_id being auto-created

  useEffect(() => {
    const childId = params.id;
    setLoading(true);
    Promise.all([
      axios.get(`${host}/child/childById/${childId}`,    { headers: { 'Content-Type': 'application/json' } }),
      axios.get(`${host}/dose/getAll`,                   { headers: { 'Content-Type': 'application/json' } }),
      axios.get(`${host}/dose/childDoses/${childId}`,    { headers: { 'Content-Type': 'application/json' } }),
    ])
      .then(([childRes, dosesRes, recordsRes]) => {
        setChild(  childRes.data?.data?.rows?.[0] || null);
        setDoses(  dosesRes.data?.data?.rows  || []);
        setRecords(recordsRes.data?.data?.rows || []);
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [params.id]);

  /* ─── merge catalog doses with existing child records ── */
  const timeline = useMemo(() => {
    if (!child || doses.length === 0) return [];
    const childAgeMonths = getAgeInMonths(child.date_of_birth);

    const merged = doses.map((dose) => {
      const doseId = dose.dose_id || dose.id;
      const record = records.find(
        (r) => `${r.dose_id}` === `${doseId}`
      );

      let displayStatus;
      if (record?.status === 'Completed')  displayStatus = 'completed';
      else if (record?.status === 'Cancelled') displayStatus = 'cancelled';
      else displayStatus = inferStatus(dose.recommended_age, childAgeMonths);

      return {
        ...dose,
        dose_id:          doseId,
        child_dose_id:    record?.child_dose_id || null,
        recordStatus:     record?.status || null,
        scheduled_date:   record?.scheduled_date || null,
        administered_date: record?.administered_date || null,
        doctor_first_name: record?.doctor_first_name || null,
        hasRecord:        !!record,
        displayStatus,
      };
    });

    return merged.sort(
      (a, b) => (SORT_ORDER[a.displayStatus] ?? 5) - (SORT_ORDER[b.displayStatus] ?? 5)
        || (a.recommended_age ?? 0) - (b.recommended_age ?? 0)
    );
  }, [child, doses, records]);

  /* ─── stats ─────────────────────────────────────────── */
  const stats = useMemo(() => ({
    completed: timeline.filter((d) => d.displayStatus === 'completed').length,
    overdue:   timeline.filter((d) => d.displayStatus === 'overdue').length,
    due:       timeline.filter((d) => d.displayStatus === 'due').length,
    upcoming:  timeline.filter((d) => d.displayStatus === 'upcoming').length,
  }), [timeline]);

  /* ─── book appointment ──────────────────────────────── */
  const handleBook = async (dose) => {
    if (dose.child_dose_id) {
      router.push(
        `/profile/childDosesByChildId/${params.id}/reserve/${dose.child_dose_id}/${params.id}`
      );
      return;
    }

    // No record yet — auto-create child_dose then go to booking
    const { appUserId } = normalizeStoredUserIds();
    const userId = appUserId || localStorage.getItem('Id');
    if (!userId) { showToast('Please log in again.', 'warning'); return; }

    setBookingId(dose.dose_id);
    try {
      const res = await axios.post(
        `${host}/child_dose/create`,
        {
          user_id:        userId,
          child_id:       params.id,
          dose_id:        dose.dose_id,
          scheduled_date: calcScheduledDate(dose.recommended_age, child?.date_of_birth),
          status:         'Pending',
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const newRecord = res.data?.data?.rows?.[0];
      const newId = newRecord?.child_dose_id;
      if (newId) {
        router.push(`/profile/childDosesByChildId/${params.id}/reserve/${newId}/${params.id}`);
      } else {
        showToast('Could not start booking. Please try again.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.msg || err.message, 'error');
    } finally {
      setBookingId(null);
    }
  };

  if (loading) return <Spinner />;

  const childAgeMonths  = getAgeInMonths(child?.date_of_birth);
  const childName       = child
    ? `${child.first_name || ''} ${child.last_name || ''}`.trim()
    : 'Child';

  return (
    <div className="child-doses-page">

      {/* ── Banner ── */}
      <div className="cd-page-header">
        <div className="container">
          <Link href="/profile" className="cd-back-link">
            <MdArrowBack /> Back to Profile
          </Link>

          <div className="cd-banner-row">
            <div>
              <h1 className="cd-title">
                <MdOutlineVaccines className="cd-title-icon" />
                {childName}&apos;s Vaccination Schedule
              </h1>
              <p className="cd-subtitle">
                <MdPerson style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Age: <strong>{formatAge(childAgeMonths)}</strong>
                {child?.date_of_birth && (
                  <span style={{ opacity: 0.75, marginLeft: 8 }}>
                    · Born {new Date(child.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="cd-stats">
            {stats.overdue > 0 && (
              <div className="cd-stat cd-stat-overdue">
                <MdWarning /> {stats.overdue} Overdue
              </div>
            )}
            {stats.due > 0 && (
              <div className="cd-stat cd-stat-due">
                <MdNotifications /> {stats.due} Due Now
              </div>
            )}
            <div className="cd-stat cd-stat-upcoming">
              <MdSchedule /> {stats.upcoming} Upcoming
            </div>
            <div className="cd-stat cd-stat-done">
              <MdCheckCircle /> {stats.completed} Completed
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="content">
        <div className="container">
          {timeline.length === 0 ? (
            <div className="cd-empty">
              <MdOutlineVaccines className="cd-empty-icon" />
              <h3>No doses in the system yet</h3>
              <p>The admin hasn&apos;t added any dose schedules yet.</p>
              <Link href="/profile" className="cd-empty-btn">Go to Profile</Link>
            </div>
          ) : (
            timeline.map((item) => {
              const meta    = STATUS_META[item.displayStatus] || STATUS_META.upcoming;
              const { Icon } = meta;
              const isBookable = item.displayStatus === 'due' || item.displayStatus === 'overdue';
              const isBooting  = bookingId === item.dose_id;

              return (
                <div key={item.dose_id} className={`card vt-card ${meta.cls}`}>

                  {/* Status badge */}
                  <span className={`card-status-badge vt-badge ${meta.cls}`}>
                    <Icon /> {meta.label}
                  </span>

                  {/* Title row */}
                  <div className="nameAndIcon">
                    <h4>{item.dose_name}</h4>
                    <Icon className={`card-check ${item.displayStatus === 'completed' ? 'done' : 'pending'}`} />
                  </div>

                  {/* Details */}
                  <div className="card-details">
                    <div className="card-detail-item">
                      <MdCalendarToday className="detail-icon" />
                      <div>
                        <span className="detail-label">Recommended Age</span>
                        <span className="detail-value">
                          {item.recommended_age != null ? formatAge(item.recommended_age) : '—'}
                        </span>
                      </div>
                    </div>

                    {item.scheduled_date && (
                      <div className="card-detail-item">
                        <MdCalendarToday className="detail-icon" />
                        <div>
                          <span className="detail-label">Scheduled Date</span>
                          <span className="detail-value">{item.scheduled_date}</span>
                        </div>
                      </div>
                    )}

                    {item.administered_date && (
                      <div className="card-detail-item">
                        <MdCalendarToday className="detail-icon done-icon" />
                        <div>
                          <span className="detail-label">Administered</span>
                          <span className="detail-value" style={{ color: '#059669' }}>
                            {item.administered_date}
                          </span>
                        </div>
                      </div>
                    )}

                    {item.doctor_first_name && (
                      <div className="card-detail-item">
                        <MdLocalHospital className="detail-icon" />
                        <div>
                          <span className="detail-label">Doctor</span>
                          <span className="detail-value">Dr. {item.doctor_first_name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="buttons">
                    <Link
                      href={`/profile/childDosesByChildId/${params.id}/${item.dose_id}`}
                      className="btn-vaccines"
                    >
                      <MdMedicalServices /> Vaccines Info
                    </Link>

                    {item.displayStatus !== 'completed' && item.displayStatus !== 'cancelled' && (
                      <button
                        className={`btn-reserve ${isBookable ? 'btn-reserve-urgent' : ''}`}
                        onClick={() => handleBook(item)}
                        disabled={isBooting}
                      >
                        <MdCalendarToday />
                        {isBooting ? 'Please wait…' : isBookable ? 'Book Now' : 'Book Appointment'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
