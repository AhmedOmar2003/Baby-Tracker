import { useEffect, useState } from 'react';
import './reservation.css';
import axios from 'axios';
import Link from 'next/link';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import { MdExpandMore, MdExpandLess, MdSchedule, MdCheckCircle, MdCancel, MdDone, MdCalendarToday } from 'react-icons/md';
import React from 'react';
import { normalizeStoredUserIds } from '@/lib/userIdentity';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';

/* Status badge metadata */
const STATUS_META = {
  Pending:   { label: 'Pending',   cls: 'res-status-pending',   Icon: MdSchedule     },
  Confirmed: { label: 'Confirmed', cls: 'res-status-confirmed', Icon: MdCheckCircle  },
  Cancelled: { label: 'Cancelled', cls: 'res-status-cancelled', Icon: MdCancel       },
  Completed: { label: 'Completed', cls: 'res-status-completed', Icon: MdDone         },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META['Pending'];
  const { label, cls, Icon } = meta;
  return (
    <span className={`res-status-pill ${cls}`}>
      <Icon />
      {label}
    </span>
  );
}

export default function Reservation() {
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [openRow, setOpenRow]         = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // reservation_id to cancel

  /* ── Fetch reservations ── */
  useEffect(() => {
    const { appUserId } = normalizeStoredUserIds();
    const userId = appUserId || localStorage.getItem('Id');
    setLoading(true);
    axios
      .get(`${host}/reservation/myReservations`, {
        headers: { 'Content-Type': 'application/json' },
        params: { user_id: userId },
      })
      .then((response) => {
        const reservations = response?.data?.data?.rows;
        if (Array.isArray(reservations)) {
          // Sort: active first (Pending → Confirmed → Completed → Cancelled), then by date desc
          const ORDER = { Pending: 0, Confirmed: 1, Completed: 2, Cancelled: 3 };
          const sorted = [...reservations].sort((a, b) => {
            const statusDiff = (ORDER[a.status] ?? 4) - (ORDER[b.status] ?? 4);
            if (statusDiff !== 0) return statusDiff;
            return new Date(b.reservation_date || 0) - new Date(a.reservation_date || 0);
          });
          setData(sorted);
        } else {
          setData([]);
        }
      })
      .catch((error) => {
        setData([]);
        showToast(
          error.response?.data?.msg || error.response?.data?.message || error.message,
          'error'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleRow = (id) => setOpenRow(openRow === id ? null : id);

  /* ── Cancel (soft-cancel via status change, not hard delete) ── */
  const executeCancel = () => {
    const reservationId = confirmTarget;
    setConfirmTarget(null);
    setCancelingId(reservationId);

    axios
      .put(
        `${host}/reservation/reservationById/${reservationId}`,
        { status: 'Cancelled' }, // notify not sent → no server notification to self
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      )
      .then(() => {
        setData((current) =>
          current.map((item) =>
            `${item.reservation_id}` === `${reservationId}`
              ? { ...item, status: 'Cancelled' }
              : item
          )
        );
        showToast('Reservation cancelled.', 'success');
      })
      .catch((error) => {
        showToast(
          error.response?.data?.msg || error.response?.data?.message || error.message,
          'error'
        );
      })
      .finally(() => setCancelingId(null));
  };

  const canCancel = (status) => status === 'Pending' || status === 'Confirmed';

  return (
    <div className="reservation">
      <div className="container">
        <h3>Reservations</h3>

        {loading ? (
          <p className="res-loading-text">Loading reservations…</p>
        ) : data.length === 0 ? (
          <div className="res-empty-cta">
            <MdCalendarToday className="res-empty-icon" />
            <h4>No reservations yet</h4>
            <p>Book a doctor appointment or a dose reservation to get started.</p>
            <Link href="/doctors" className="res-empty-btn">Browse Doctors</Link>
          </div>
        ) : (
          <div className="reservation-list">
            {data.map((item) => {
              const isCancelled = item.status === 'Cancelled';
              const isCompleted = item.status === 'Completed';
              return (
                <div
                  key={item.reservation_id}
                  className={`reservation-item${isCancelled ? ' res-item-cancelled' : ''}${isCompleted ? ' res-item-completed' : ''}`}
                >
                  <div
                    className="reservation-header"
                    onClick={() => toggleRow(item.reservation_id)}
                  >
                    <button className="arrow-button">
                      {openRow === item.reservation_id ? (
                        <MdExpandLess />
                      ) : (
                        <MdExpandMore title="Show Details" />
                      )}
                    </button>
                    <div className="reservation-info">
                      <p>
                        <strong>Doctor:</strong>{' '}
                        {item.doctor_name ? `Dr. ${item.doctor_name}` : '—'}
                      </p>
                      <p>
                        <strong>Type:</strong>{' '}
                        {item.reservation_kind || (item.child_dose_id ? 'Dose reservation' : 'Doctor appointment')}
                      </p>
                      <StatusBadge status={item.status || 'Pending'} />
                    </div>
                  </div>

                  {/* Details panel */}
                  <div className={`note-container ${openRow === item.reservation_id ? 'open' : ''}`}>
                    <div className="contentCard">
                      <p><strong>Date</strong>{item.reservation_date || 'Not available'}</p>
                      <p><strong>Day</strong>{item.reservation_day || item.available_day || item.reservation_date || 'Not available'}</p>
                      <p><strong>Time</strong>{item.reservation_time || '—'}</p>
                      <p><strong>Child</strong>{item.child_name || '—'}</p>
                      <p><strong>Parent</strong>{item.user_name || '—'}</p>
                      <p><strong>Note</strong>{item.notes || 'No note'}</p>
                    </div>
                  </div>

                  {/* Cancel panel — only for Pending / Confirmed */}
                  {canCancel(item.status) && (
                    <div className={`note-container cancel ${openRow === item.reservation_id ? 'open' : ''}`}>
                      <button
                        onClick={() => setConfirmTarget(item.reservation_id)}
                        disabled={cancelingId === item.reservation_id}
                      >
                        {cancelingId === item.reservation_id ? 'Cancelling…' : 'Cancel Reservation'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmTarget}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep it"
        isDanger={true}
        onConfirm={executeCancel}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
