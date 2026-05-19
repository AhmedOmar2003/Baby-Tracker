'use client';
import { useEffect, useState } from 'react';
import '@/Components/AdminDashboard/adminSection.css';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { MdAdd, MdDelete, MdEdit, MdMedication } from 'react-icons/md';
import { addAdminNotification } from '@/hooks/useAdminNotifications';

const MED_CATEGORIES = ['Analgesics', 'Antibiotics', 'Antivirals', 'Antifungals', 'Vitamins', 'Vaccines', 'Cardiovascular', 'Respiratory', 'Dermatology', 'Digestive', 'Pediatrics', 'Other'];
const EMPTY = { name: '', description: '', dosage: '', manufacturer: '', price: '', category: '', prescriptionRequired: '', sideEffects: '', image: '' };
function EditMedicineModal({ medicineId, medicines, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const med = medicines.find(m => m._id === medicineId);
    if (med) {
      setForm({
        name: med.name || '',
        description: med.description || '',
        dosage: med.dosage || '',
        manufacturer: med.manufacturer || '',
        price: String(med.price || ''),
        category: med.category || '',
        prescriptionRequired: String(med.prescriptionRequired || false),
        sideEffects: med.sideEffects ? med.sideEffects.join(', ') : '',
        image: med.image || '',
      });
    }
  }, [medicineId, medicines]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        dosage: form.dosage,
        manufacturer: form.manufacturer,
        price: Number(form.price),
        category: form.category,
        prescriptionRequired: form.prescriptionRequired === 'true',
        sideEffects: parseArr(form.sideEffects),
        image: form.image,
      };
      await axios.put(`${host}/medicine/update/${medicineId}`, payload, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      showToast('Medicine updated successfully ✅', 'success');
      addAdminNotification({ title: 'Medicine Updated', message: `"${form.name}" details were updated.`, type: 'edit', section: 'medicine' });
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, width: '90%', maxWidth: 640, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '1.25rem', color: 'var(--section-head-color)' }}>Edit Medicine</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="af-field"><label>Medicine Name</label><input name="name" value={form.name} onChange={handleChange} required /></div>
            <div className="af-field"><label>Manufacturer</label><input name="manufacturer" value={form.manufacturer} onChange={handleChange} required /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="af-field"><label>Category</label><select name="category" value={form.category} onChange={handleChange} required>{MED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="af-field"><label>Dosage</label><input name="dosage" value={form.dosage} onChange={handleChange} required /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="af-field"><label>Price (EGP)</label><input name="price" type="number" value={form.price} onChange={handleChange} required step="0.01" /></div>
            <div className="af-field"><label>Prescription Required</label><select name="prescriptionRequired" value={form.prescriptionRequired} onChange={handleChange} required><option value="true">Yes</option><option value="false">No</option></select></div>
          </div>
          <div className="af-field"><label>Image URL</label><input name="image" type="url" value={form.image} onChange={handleChange} required /></div>
          <div className="af-field"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} required rows={3} /></div>
          <div className="af-field"><label>Side Effects (comma-separated)</label><input name="sideEffects" value={form.sideEffects} onChange={handleChange} required /></div>
          
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#555', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'var(--gradient-primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Medicines() {
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
    axios.get(`${host}/medicine/getAll`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => setData(res.data.data.rows))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { getAllData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { name, description, dosage, manufacturer, price, category, prescriptionRequired, sideEffects, image } = form;
    if (!name || !description || !dosage || !manufacturer || !price || !category || !prescriptionRequired || !sideEffects || !image) {
      showToast('Please fill all required fields.', 'warning'); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${host}/medicine/create`, {
        name, description, dosage, manufacturer,
        price: Number(price),
        category,
        prescriptionRequired: prescriptionRequired === 'true',
        sideEffects: parseArr(sideEffects),
        image,
      }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      showToast('Medicine added successfully ✅', 'success');
      addAdminNotification({ title: 'Medicine Added', message: `"${form.name}" (${form.category}) was added to the database.`, type: 'add', section: 'medicine' });
      setForm(EMPTY); setShowForm(false); getAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = () => {
    axios.delete(`${host}/medicine/medicineById/${deleteTarget}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then(() => { showToast('Medicine deleted ✅', 'success'); addAdminNotification({ title: 'Medicine Deleted', message: 'A medicine was removed from the database.', type: 'delete', section: 'medicine' }); getAllData(); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setDeleteTarget(null));
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Medicines</h2>
          <p>{data.length} medicine{data.length !== 1 ? 's' : ''} in database</p>
        </div>
        <button className={`btn-toggle-form ${showForm ? 'open' : ''}`} onClick={() => setShowForm(!showForm)}>
          <MdAdd /> {showForm ? 'Cancel' : 'New Medicine'}
        </button>
      </div>

      <div className={`admin-form-panel ${showForm ? 'open' : ''}`}>
        <div className="admin-form-card">
          <form onSubmit={handleAdd}>
            <div className="admin-form-grid">
              <div className="af-field">
                <label>Medicine Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Paracetamol" />
              </div>
              <div className="af-field">
                <label>Manufacturer *</label>
                <input name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="e.g. Pfizer" />
              </div>
              <div className="af-field">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select category…</option>
                  {MED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="af-field">
                <label>Dosage *</label>
                <input name="dosage" value={form.dosage} onChange={handleChange} placeholder="e.g. 500mg twice daily" />
              </div>
              <div className="af-field">
                <label>Price (EGP) *</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="e.g. 25.50" step="0.01" />
              </div>
              <div className="af-field">
                <label>Prescription Required *</label>
                <select name="prescriptionRequired" value={form.prescriptionRequired} onChange={handleChange}>
                  <option value="">Choose…</option>
                  <option value="true">Yes — Prescription needed</option>
                  <option value="false">No — Over the counter</option>
                </select>
              </div>
              <div className="af-field span2">
                <label>Image URL *</label>
                <input name="image" type="url" value={form.image} onChange={handleChange} placeholder="https://example.com/medicine.jpg" />
              </div>
              <div className="af-field span2">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Brief description of the medicine…" rows={3} />
              </div>
              <div className="af-field span2">
                <label>Side Effects * (comma-separated)</label>
                <input name="sideEffects" value={form.sideEffects} onChange={handleChange} placeholder="Nausea, Headache, Dizziness" />
              </div>
            </div>
            <div className="af-actions">
              <button type="button" className="af-btn-cancel" onClick={() => { setShowForm(false); setForm(EMPTY); }}>Cancel</button>
              <button type="submit" className="af-btn-submit" disabled={submitting}>
                <MdMedication /> {submitting ? 'Saving…' : 'Add Medicine'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading medicines…</div>
      ) : data.length === 0 ? (
        <div className="admin-empty">No medicines yet. Add your first medicine above.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Manufacturer</th>
                <th>Category</th>
                <th>Price</th>
                <th>Rx Required</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item._id}>
                  <td><span style={{ fontWeight: 700 }}>{item.name}</span></td>
                  <td>{item.manufacturer}</td>
                  <td><span className="badge badge-info">{item.category}</span></td>
                  <td>{item.price ? `${item.price} EGP` : '—'}</td>
                  <td>
                    <span className={`badge ${item.prescriptionRequired ? 'badge-warn' : 'badge-success'}`}>
                      {item.prescriptionRequired ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <div className="tbl-actions">
                      <button className="tbl-btn edit" onClick={() => setEditTarget(item._id)} title="Edit"><MdEdit /></button>
                      <button className="tbl-btn delete" onClick={() => setDeleteTarget(item._id)} title="Delete"><MdDelete /></button>
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
        title="Delete Medicine"
        message="Are you sure you want to permanently delete this medicine?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditMedicineModal
          medicineId={editTarget}
          medicines={data}
          onClose={() => setEditTarget(null)}
          onSave={() => { setEditTarget(null); getAllData(); }}
        />
      )}
    </div>
  );
}
