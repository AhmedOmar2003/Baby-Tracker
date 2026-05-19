'use client';

import { useEffect, useState } from 'react';
import '@/Components/AdminDashboard/adminSection.css';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { MdAdd, MdDelete, MdEdit, MdOutlineVaccines } from 'react-icons/md';
import { addAdminNotification } from '@/hooks/useAdminNotifications';

const EMPTY = { dose_name: '', recommended_age: '', description: '', image: '' };

function EditDoseModal({ doseId, doses, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dose = doses.find((d) => `${d.dose_id}` === `${doseId}`);
    if (dose) {
      setForm({
        dose_name: dose.dose_name || '',
        recommended_age: dose.recommended_age ?? '',
        description: dose.description || '',
        image: dose.image || '',
      });
    }
  }, [doseId, doses]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        `${host}/dose/doseById/${doseId}`,
        {
          dose_name: form.dose_name,
          recommended_age: Number(form.recommended_age),
          description: form.description,
          image: form.image || null,
        },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      showToast('Dose updated successfully ✅', 'success');
      addAdminNotification({ title: 'Dose Updated', message: `"${form.dose_name}" schedule was updated.`, type: 'edit', section: 'doses' });
      onSave();
    } catch (err) {
      showToast(err.response?.data?.msg || err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, width: '90%', maxWidth: 540, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '1.25rem', color: 'var(--section-head-color)' }}>Edit Dose</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="af-field">
              <label>Dose Name</label>
              <input name="dose_name" value={form.dose_name} onChange={handleChange} required />
            </div>
            <div className="af-field">
              <label>Recommended Age (months)</label>
              <input name="recommended_age" type="number" min="0" value={form.recommended_age} onChange={handleChange} required />
            </div>
          </div>
          <div className="af-field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Short description of this dose..." />
          </div>
          <div className="af-field">
            <label>Image URL</label>
            <input
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#555', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'var(--gradient-primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Doses() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  function getAllData() {
    setLoading(true);
    axios
      .get(`${host}/dose/getAll`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => setData(res.data.data.rows || []))
      .catch((err) => showToast(err.response?.data?.msg || err.response?.data?.message || err.message, 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getAllData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { dose_name, recommended_age, description, image } = form;
    if (!dose_name || !recommended_age || !image) {
      showToast('Please fill the required fields.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${host}/dose/create`,
        {
          dose_name,
          recommended_age: Number(recommended_age),
          description,
          image,
        },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      showToast('Dose added successfully ✅', 'success');
      addAdminNotification({ title: 'Dose Added', message: `"${form.dose_name}" (age ${form.recommended_age}m) was added.`, type: 'add', section: 'doses' });
      setForm(EMPTY);
      setShowForm(false);
      getAllData();
    } catch (err) {
      showToast(err.response?.data?.msg || err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    axios
      .delete(`${host}/dose/doseById/${deleteTarget}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then(() => {
        showToast('Dose deleted ✅', 'success');
        addAdminNotification({ title: 'Dose Deleted', message: 'A dose was removed from the schedule.', type: 'delete', section: 'doses' });
        getAllData();
      })
      .catch((err) => showToast(err.response?.data?.msg || err.response?.data?.message || err.message, 'error'))
      .finally(() => setDeleteTarget(null));
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Doses</h2>
          <p>{data.length} dose{data.length !== 1 ? 's' : ''} in database</p>
        </div>
        <button className={`btn-toggle-form ${showForm ? 'open' : ''}`} onClick={() => setShowForm(!showForm)}>
          <MdAdd /> {showForm ? 'Cancel' : 'New Dose'}
        </button>
      </div>

      <div className={`admin-form-panel ${showForm ? 'open' : ''}`}>
        <div className="admin-form-card">
          <form onSubmit={handleAdd}>
            <div className="admin-form-grid">
              <div className="af-field">
                <label>Dose Name *</label>
                <input name="dose_name" value={form.dose_name} onChange={handleChange} placeholder="e.g. 2-Month Dose" />
              </div>
              <div className="af-field">
                <label>Recommended Age (months) *</label>
                <input name="recommended_age" type="number" min="0" value={form.recommended_age} onChange={handleChange} placeholder="e.g. 2" />
              </div>
              <div className="af-field span2">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Short description for parents..." rows={3} />
              </div>
              <div className="af-field span2">
                <label>Image URL *</label>
                <input
                  name="image"
                  type="url"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/dose.jpg"
                />
              </div>
            </div>
            <div className="af-actions">
              <button type="button" className="af-btn-cancel" onClick={() => { setShowForm(false); setForm(EMPTY); }}>Cancel</button>
              <button type="submit" className="af-btn-submit" disabled={submitting}>
                <MdOutlineVaccines /> {submitting ? 'Saving…' : 'Add Dose'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading doses…</div>
      ) : data.length === 0 ? (
        <div className="admin-empty">No doses yet. Add your first dose above.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dose Name</th>
                <th>Recommended Age</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.dose_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(54,64,206,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MdOutlineVaccines style={{ color: '#3640ce', fontSize: '1.1rem' }} />
                      </div>
                      <span style={{ fontWeight: 700 }}>{item.dose_name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{item.recommended_age} month{item.recommended_age !== 1 ? 's' : ''}</span></td>
                  <td style={{ fontSize: '0.88rem', color: '#666' }}>{item.description || 'No description'}</td>
                  <td>
                    <div className="tbl-actions">
                      <button className="tbl-btn edit" onClick={() => setEditTarget(item.dose_id)} title="Edit"><MdEdit /></button>
                      <button className="tbl-btn delete" onClick={() => setDeleteTarget(item.dose_id)} title="Delete"><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Dose"
        message="Are you sure you want to permanently delete this dose?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditDoseModal
          doseId={editTarget}
          doses={data}
          onClose={() => setEditTarget(null)}
          onSave={() => {
            setEditTarget(null);
            getAllData();
          }}
        />
      )}
    </div>
  );
}
