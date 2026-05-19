'use client';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import {
  MdOutlineVaccines, MdCheckCircle, MdRadioButtonUnchecked, MdDelete,
  MdSearch, MdRefresh, MdPerson, MdCalendarToday, MdClose,
  MdChildCare, MdMedicalServices, MdHistory,
} from 'react-icons/md';
import './childDoses.css';

export default function ChildDosesAdmin() {
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilter]     = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    axios
      .get(`${host}/child_dose/all`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => setData(res.data?.data?.rows || []))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Delete ── */
  const handleDelete = () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    axios
      .delete(`${host}/child_dose/childDoseById/${id}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then(() => {
        setData((prev) => prev.filter((d) => d.child_dose_id !== id));
        showToast('Record deleted ✅', 'success');
      })
      .catch((err) => showToast(err.message, 'error'));
  };

  /* ── Stats ── */
  const total     = data.length;
  const completed = data.filter((d) => d.status === 'Completed').length;
  const pending   = data.filter((d) => d.status === 'Pending').length;
  const cancelled = data.filter((d) => d.status === 'Cancelled').length;

  /* ── Filter + search ── */
  const displayed = data.filter((d) => {
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (d.child_first_name || '').toLowerCase().includes(q) ||
      (d.dose_name        || '').toLowerCase().includes(q) ||
      (d.user_name        || '').toLowerCase().includes(q) ||
      (d.doctor_first_name|| '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="cd-adm">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2><MdHistory style={{ verticalAlign: 'middle', marginRight: 6 }} />Vaccination History</h2>
          <p>
            Auto-updated when reservations are completed —{' '}
            <strong>{completed}</strong> of <strong>{total}</strong> doses administered
          </p>
        </div>
        <button className="btn-toggle-form" onClick={fetchAll}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="cd-adm-stats">
        {[
          { label: 'Total',      count: total,     cls: 'cd-stat-total',     icon: MdOutlineVaccines },
          { label: 'Pending',    count: pending,   cls: 'cd-stat-pending',   icon: MdRadioButtonUnchecked, key: 'Pending' },
          { label: 'Completed',  count: completed, cls: 'cd-stat-completed', icon: MdCheckCircle, key: 'Completed' },
          { label: 'Cancelled',  count: cancelled, cls: 'cd-stat-cancelled', icon: MdClose, key: 'Cancelled' },
        ].map(({ label, count, cls, icon: Icon, key }) => (
          <button
            key={label}
            className={`cd-adm-stat ${cls} ${filterStatus === key ? 'active' : ''}`}
            onClick={() => key && setFilter(filterStatus === key ? 'All' : key)}
          >
            <Icon />
            <div>
              <strong>{count}</strong>
              <span>{label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="cd-adm-toolbar">
        <div className="cd-adm-search-wrap">
          <MdSearch className="cd-adm-search-icon" />
          <input
            type="text"
            placeholder="Search child, dose, parent, doctor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cd-adm-search"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilter(e.target.value)}
          className="cd-adm-filter"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="res-loading">Loading vaccination history…</div>
      ) : displayed.length === 0 ? (
        <div className="res-empty">
          <MdOutlineVaccines />
          <p>No vaccination records found.</p>
        </div>
      ) : (
        <div className="res-table-wrap">
          <table className="res-table">
            <thead>
              <tr>
                <th><MdChildCare /> Child</th>
                <th><MdPerson /> Parent</th>
                <th><MdOutlineVaccines /> Dose</th>
                <th><MdMedicalServices /> Doctor</th>
                <th><MdCalendarToday /> Scheduled</th>
                <th><MdCalendarToday /> Administered</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => {
                const isDone      = item.status === 'Completed';
                const isCancelled = item.status === 'Cancelled';
                return (
                  <tr key={item.child_dose_id}>
                    <td className="res-td-name">{item.child_first_name || '—'}</td>
                    <td>{item.user_name || '—'}</td>
                    <td>
                      <span className="res-kind-badge"><MdOutlineVaccines /> {item.dose_name || '—'}</span>
                    </td>
                    <td>{item.doctor_first_name ? `Dr. ${item.doctor_first_name}` : '—'}</td>
                    <td>{item.scheduled_date || '—'}</td>
                    <td>
                      {item.administered_date
                        ? <span style={{ color: '#059669', fontWeight: 600 }}>{item.administered_date}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>
                      }
                    </td>
                    <td>
                      <span className={`res-status-badge ${
                        isDone ? 'status-completed' : isCancelled ? 'status-cancelled' : 'status-pending'
                      }`}>
                        {isDone ? <MdCheckCircle /> : isCancelled ? <MdClose /> : <MdRadioButtonUnchecked />}
                        {item.status || 'Pending'}
                      </span>
                    </td>
                    <td className="res-td-actions">
                      <button
                        className="tbl-btn delete"
                        title="Remove record"
                        onClick={() => setDeleteTarget(item.child_dose_id)}
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
        title="Remove Vaccination Record"
        message="Are you sure you want to permanently remove this vaccination record?"
        confirmText="Yes, Remove"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
