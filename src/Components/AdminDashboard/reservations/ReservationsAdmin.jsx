'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { addAdminNotification } from '@/hooks/useAdminNotifications';
import {
  MdCalendarToday, MdSearch, MdFilterList, MdDelete,
  MdPerson, MdChildCare, MdMedicalServices, MdRefresh,
  MdCheckCircle, MdCancel, MdSchedule, MdDone,
} from 'react-icons/md';
import './reservations.css';

const STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

const STATUS_META = {
  Pending:   { label: 'Pending',   icon: MdSchedule,     cls: 'status-pending'   },
  Confirmed: { label: 'Confirmed', icon: MdCheckCircle,  cls: 'status-confirmed' },
  Cancelled: { label: 'Cancelled', icon: MdCancel,       cls: 'status-cancelled' },
  Completed: { label: 'Completed', icon: MdDone,         cls: 'status-completed' },
};

export default function ReservationsAdmin() {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    axios
      .get(`${host}/reservation/all`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => setData(res.data?.data?.rows || []))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Status change ── */
  const handleStatusChange = async (reservation, newStatus) => {
    if (reservation.status === newStatus) return;
    setUpdatingId(reservation.reservation_id);
    try {
      await axios.put(
        `${host}/reservation/reservationById/${reservation.reservation_id}`,
        { status: newStatus, notify: true },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      setData((prev) =>
        prev.map((r) =>
          r.reservation_id === reservation.reservation_id ? { ...r, status: newStatus } : r
        )
      );
      addAdminNotification({
        title: 'Reservation Updated',
        message: `Reservation for ${reservation.child_name || 'a child'} changed to "${newStatus}".`,
        type: 'edit',
        section: 'reservations',
      });
      showToast(`Status changed to "${newStatus}" ✅`, 'success');
    } catch (err) {
      showToast(err.response?.data?.msg || err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Delete ── */
  const handleDelete = () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    axios
      .delete(`${host}/reservation/reservationById/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .then(() => {
        setData((prev) => prev.filter((r) => r.reservation_id !== id));
        showToast('Reservation deleted ✅', 'success');
        addAdminNotification({ title: 'Reservation Deleted', message: 'A reservation was removed.', type: 'delete', section: 'reservations' });
      })
      .catch((err) => showToast(err.message, 'error'));
  };

  /* ── Filter + search ── */
  const displayed = data.filter((r) => {
    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (r.child_name || '').toLowerCase().includes(q) ||
      (r.user_name  || '').toLowerCase().includes(q) ||
      (r.doctor_name|| '').toLowerCase().includes(q) ||
      (r.reservation_kind || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  /* ── Stats ── */
  const stats = STATUSES.map((s) => ({
    status: s,
    count: data.filter((r) => r.status === s).length,
  }));

  return (
    <div className="res-admin">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2>Reservations</h2>
          <p>{data.length} total reservation{data.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-toggle-form" onClick={fetchAll}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {/* Status summary cards */}
      <div className="res-stats-row">
        {stats.map(({ status, count }) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <button
              key={status}
              className={`res-stat-card ${meta.cls} ${filterStatus === status ? 'res-stat-active' : ''}`}
              onClick={() => setFilter(filterStatus === status ? 'All' : status)}
            >
              <Icon className="res-stat-icon" />
              <div>
                <strong>{count}</strong>
                <span>{meta.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + filter bar */}
      <div className="res-toolbar">
        <div className="res-search-wrap">
          <MdSearch className="res-search-icon" />
          <input
            type="text"
            placeholder="Search by patient, doctor, child…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="res-search-input"
          />
        </div>
        <div className="res-filter-wrap">
          <MdFilterList />
          <select value={filterStatus} onChange={(e) => setFilter(e.target.value)} className="res-filter-select">
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="res-loading">Loading reservations…</div>
      ) : displayed.length === 0 ? (
        <div className="res-empty">
          <MdCalendarToday />
          <p>No reservations found.</p>
        </div>
      ) : (
        <div className="res-table-wrap">
          <table className="res-table">
            <thead>
              <tr>
                <th><MdChildCare /> Child</th>
                <th><MdPerson /> Parent</th>
                <th><MdMedicalServices /> Doctor</th>
                <th>Type</th>
                <th><MdCalendarToday /> Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META['Pending'];
                const isUpdating = updatingId === r.reservation_id;
                return (
                  <tr key={r.reservation_id} className={isUpdating ? 'res-row-updating' : ''}>
                    <td className="res-td-name">{r.child_name || '—'}</td>
                    <td>{r.user_name || '—'}</td>
                    <td>{r.doctor_name ? `Dr. ${r.doctor_name}` : '—'}</td>
                    <td>
                      <span className="res-kind-badge">
                        {r.reservation_kind === 'Dose reservation' ? '💉 Dose' : '🩺 Doctor'}
                      </span>
                    </td>
                    <td>{r.reservation_date || r.reservation_day || '—'}</td>
                    <td>{r.reservation_time || '—'}</td>
                    <td>
                      <div className={`res-status-badge ${meta.cls}`}>
                        <meta.icon />
                        {meta.label}
                      </div>
                    </td>
                    <td className="res-td-actions">
                      {/* Status dropdown */}
                      <select
                        className="res-status-select"
                        value={r.status || 'Pending'}
                        disabled={isUpdating}
                        onChange={(e) => handleStatusChange(r, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {/* Delete */}
                      <button
                        className="tbl-btn delete"
                        onClick={() => setDeleteTarget(r.reservation_id)}
                        title="Delete reservation"
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Reservation"
        message="Are you sure you want to permanently delete this reservation?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
