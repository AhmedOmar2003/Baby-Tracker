'use client';
import { useEffect, useState } from 'react';
import '@/Components/AdminDashboard/adminSection.css';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { MdAdd, MdDelete, MdEdit, MdOutlineVaccines } from 'react-icons/md';
import Link from 'next/link';
import { addAdminNotification } from '@/hooks/useAdminNotifications';

const EMPTY_VACCINE_FORM = {
  vaccine_name: '',
  description: '',
  min_age: '',
  max_age: '',
  doses_required: '',
  is_mandatory: '',
  dose_id: '',
  image: '',
};

function EditVaccineModal({ vaccineId, vaccines, doses, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_VACCINE_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const vac = vaccines.find(v => v.vaccine_id === vaccineId);
    if (vac) {
      setForm({
        vaccine_name:  vac.vaccine_name  || '',
        description:   vac.description   || '',
        min_age:       vac.min_age       ?? '',
        max_age:       vac.max_age       ?? '',
        doses_required: vac.doses_required ?? '',
        is_mandatory:  String(vac.is_mandatory ?? ''),
        dose_id:       vac.dose_id       || '',
        image:         vac.image         || '',
      });
    }
  }, [vaccineId, vaccines]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        vaccine_name:   form.vaccine_name,
        description:    form.description,
        min_age:        Number(form.min_age),
        max_age:        Number(form.max_age),
        doses_required: Number(form.doses_required),
        is_mandatory:   form.is_mandatory === 'true',
        dose_id:        form.dose_id || null,
        image:          form.image || null,
      };
      await axios.put(`${host}/vaccine/vaccineById/${vaccineId}`, payload, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      showToast('Vaccine updated successfully ✅', 'success');
      addAdminNotification({ title: 'Vaccine Updated', message: `"${form.vaccine_name}" details were updated.`, type: 'edit', section: 'vaccines' });
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, width: '90%', maxWidth: 540, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '1.25rem', color: 'var(--section-head-color)' }}>Edit Vaccine</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="af-field"><label>Vaccine Name</label><input name="vaccine_name" value={form.vaccine_name} onChange={handleChange} required /></div>
            <div className="af-field"><label>Doses Required</label><input name="doses_required" type="number" value={form.doses_required} onChange={handleChange} required /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="af-field"><label>Min Age (months)</label><input name="min_age" type="number" value={form.min_age} onChange={handleChange} required /></div>
            <div className="af-field"><label>Max Age (months)</label><input name="max_age" type="number" value={form.max_age} onChange={handleChange} required /></div>
          </div>
          <div className="af-field"><label>Is Mandatory</label><select name="is_mandatory" value={form.is_mandatory} onChange={handleChange} required><option value="true">Yes</option><option value="false">No</option></select></div>
          <div className="af-field">
            <label>Belongs to Dose</label>
            <select name="dose_id" value={form.dose_id} onChange={handleChange}>
              <option value="">— Standalone —</option>
              {doses.map((d) => (
                <option key={d.dose_id || d.id} value={d.dose_id || d.id}>{d.dose_name}</option>
              ))}
            </select>
          </div>
          <div className="af-field"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} required rows={3} /></div>
          <div className="af-field"><label>Image URL</label><input name="image" type="url" value={form.image} onChange={handleChange} required /></div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#555', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'var(--gradient-primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Vaccines() {
  const [data, setData]         = useState([]);
  const [doses, setDoses]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_VACCINE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget]     = useState(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  function getAllData() {
    setLoading(true);
    axios.get(`${host}/vaccine/getAll`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => setData(res.data.data.rows))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getAllData();
    // Fetch doses list for the dose_id selector
    axios.get(`${host}/dose/getAll`, { headers: { 'Content-Type': 'application/json' } })
      .then((res) => setDoses(res.data?.data?.rows || []))
      .catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { vaccine_name, description, min_age, max_age, doses_required, is_mandatory, dose_id, image } = form;
    if (!vaccine_name || !description || !min_age || !max_age || !doses_required || !is_mandatory || !image) {
      showToast('Please fill all required fields.', 'warning'); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${host}/vaccine/create`, {
        vaccine_name, description,
        min_age: Number(min_age),
        max_age: Number(max_age),
        doses_required: Number(doses_required),
        is_mandatory: is_mandatory === 'true',
        dose_id: dose_id || null,
        image,
      }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      showToast('Vaccine added successfully ✅', 'success');
      addAdminNotification({ title: 'Vaccine Added', message: `"${form.vaccine_name}" was added to the database.`, type: 'add', section: 'vaccines' });
      setForm(EMPTY_VACCINE_FORM);
      setShowForm(false);
      getAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = () => {
    axios.delete(`${host}/vaccine/vaccineById/${deleteTarget}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then(() => { showToast('Vaccine deleted ✅', 'success'); addAdminNotification({ title: 'Vaccine Deleted', message: 'A vaccine was removed from the database.', type: 'delete', section: 'vaccines' }); getAllData(); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setDeleteTarget(null));
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Vaccines</h2>
          <p>{data.length} vaccine{data.length !== 1 ? 's' : ''} in database</p>
        </div>
        <button className={`btn-toggle-form ${showForm ? 'open' : ''}`} onClick={() => setShowForm(!showForm)}>
          <MdAdd /> {showForm ? 'Cancel' : 'New Vaccine'}
        </button>
      </div>

      <div className={`admin-form-panel ${showForm ? 'open' : ''}`}>
        <div className="admin-form-card">
          <form onSubmit={handleAdd}>
            <div className="admin-form-grid">
              <div className="af-field">
                <label>Vaccine Name *</label>
                <input name="vaccine_name" value={form.vaccine_name} onChange={handleChange} placeholder="e.g. BCG Vaccine" />
              </div>
              <div className="af-field">
                <label>Doses Required *</label>
                <input name="doses_required" type="number" min="1" value={form.doses_required} onChange={handleChange} placeholder="e.g. 3" />
              </div>
              <div className="af-field">
                <label>Min Age (months) *</label>
                <input name="min_age" type="number" min="0" value={form.min_age} onChange={handleChange} placeholder="e.g. 0" />
              </div>
              <div className="af-field">
                <label>Max Age (months) *</label>
                <input name="max_age" type="number" min="0" value={form.max_age} onChange={handleChange} placeholder="e.g. 24" />
              </div>
              <div className="af-field">
                <label>Is Mandatory *</label>
                <select name="is_mandatory" value={form.is_mandatory} onChange={handleChange}>
                  <option value="">Choose…</option>
                  <option value="true">Yes — Mandatory</option>
                  <option value="false">No — Optional</option>
                </select>
              </div>
              <div className="af-field">
                <label>Belongs to Dose</label>
                <select name="dose_id" value={form.dose_id} onChange={handleChange}>
                  <option value="">— Standalone (no dose) —</option>
                  {doses.map((d) => (
                    <option key={d.dose_id || d.id} value={d.dose_id || d.id}>
                      {d.dose_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="af-field span2">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Brief description of the vaccine and its purpose…" rows={3} />
              </div>
              <div className="af-field span2">
                <label>Image URL *</label>
                <input
                  name="image"
                  type="url"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/vaccine.jpg"
                />
              </div>
            </div>
            <div className="af-actions">
          <button
            type="button"
            className="af-btn-cancel"
            onClick={() => {
              setShowForm(false);
              setForm(EMPTY_VACCINE_FORM);
            }}
          >
            Cancel
          </button>
              <button type="submit" className="af-btn-submit" disabled={submitting}>
                <MdOutlineVaccines /> {submitting ? 'Saving…' : 'Add Vaccine'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading vaccines…</div>
      ) : data.length === 0 ? (
        <div className="admin-empty">No vaccines yet. Add your first vaccine above.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vaccine Name</th>
                <th>Dose Group</th>
                <th>Doses</th>
                <th>Age Range</th>
                <th>Mandatory</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.vaccine_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MdOutlineVaccines style={{ color: '#8b5cf6', fontSize: '1.1rem' }} />
                      </div>
                      <span style={{ fontWeight: 700 }}>{item.vaccine_name}</span>
                    </div>
                  </td>
                  <td>
                    {item.dose_id
                      ? <span className="badge badge-info">{doses.find(d => (d.dose_id || d.id) === item.dose_id)?.dose_name || 'Linked'}</span>
                      : <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>—</span>
                    }
                  </td>
                  <td><span className="badge badge-info">{item.doses_required} dose{item.doses_required !== 1 ? 's' : ''}</span></td>
                  <td style={{ fontSize: '0.88rem', color: '#666' }}>{item.min_age}–{item.max_age} months</td>
                  <td>
                    <span className={`badge ${item.is_mandatory ? 'badge-warn' : 'badge-gray'}`}>
                      {item.is_mandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </td>
                  <td>
                    <div className="tbl-actions">
                      <button className="tbl-btn edit" onClick={() => setEditTarget(item.vaccine_id)} title="Edit"><MdEdit /></button>
                      <button className="tbl-btn delete" onClick={() => setDeleteTarget(item.vaccine_id)} title="Delete"><MdDelete /></button>
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
        title="Delete Vaccine"
        message="Are you sure you want to permanently delete this vaccine?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditVaccineModal
          vaccineId={editTarget}
          vaccines={data}
          doses={doses}
          onClose={() => setEditTarget(null)}
          onSave={() => { setEditTarget(null); getAllData(); }}
        />
      )}
    </div>
  );
}
