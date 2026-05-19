'use client';
import { useEffect, useState } from 'react';
import '@/Components/AdminDashboard/adminSection.css';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import Image from 'next/image';
import Link from 'next/link';
import { MdAdd, MdEdit, MdDelete, MdVerified, MdOutlineVerified, MdClose, MdSave, MdEmail } from 'react-icons/md';
import { addAdminNotification } from '@/hooks/useAdminNotifications';
import { FaUserDoctor, FaCalendarCheck } from 'react-icons/fa6';
import doctoAdmin from '../../../assets/images/doctorAdmin/doctor.jpg';

const SPECIALIZATIONS = [
  'General Medicine', 'Pediatrics', 'Cardiology', 'Dermatology',
  'Neurology', 'Orthopedics', 'Gynecology', 'Ophthalmology',
  'ENT', 'Psychiatry', 'Dentistry', 'Internal Medicine',
  'Surgery', 'Urology', 'Oncology', 'Endocrinology',
  'Gastroenterology', 'Nephrology', 'Pulmonology', 'Rheumatology',
];

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', password: '',
  phone_number: '', whatsapp: '', specialization: '', license_number: '',
  verified: '', bio: '', rating: '', image_url: '',
};

function EditDoctorModal({ docId, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${host}/doctor/${docId}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => {
        const d = res.data.data.rows[0];
        setForm({
          first_name: d.first_name || '', last_name: d.last_name || '',
          email: d.email || '', phone_number: d.phone_number || '',
          whatsapp: d.whatsapp || '',
          specialization: d.specialization || '', license_number: d.license_number || '',
          verified: d.verified || '',
          bio: d.bio || '', rating: d.rating || '',
          image_url: d.image_url || '',
        });
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [docId]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${host}/user/update/${docId}`, {
        first_name: form.first_name, last_name: form.last_name,
        email: form.email, phone_number: form.phone_number,
        role: 'Doctor',
      }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });

      await axios.put(`${host}/doctor/update/${docId}`, {
        user_id: docId, specialization: form.specialization, license_number: form.license_number,
        whatsapp: form.whatsapp, bio: form.bio, rating: Number(form.rating) || 0,
        image_url: form.image_url || null,
      }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });

      showToast('Doctor updated successfully ✅', 'success');
      addAdminNotification({ title: 'Doctor Updated', message: `Dr. ${form.first_name} ${form.last_name}'s profile was updated.`, type: 'edit', section: 'doctors' });
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem 1rem', zIndex: 9999, overflowY: 'auto' }}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, width: '90%', maxWidth: 540, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto', boxSizing: 'border-box' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '1.25rem', color: 'var(--section-head-color)' }}>Edit Doctor</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading data...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="af-field">
                <label>First Name</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} required />
              </div>
              <div className="af-field">
                <label>Last Name</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="af-field">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="af-field">
                <label>Phone Number</label>
                <input name="phone_number" value={form.phone_number} onChange={handleChange} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="af-field">
                <label>Specialization</label>
                <select name="specialization" value={form.specialization} onChange={handleChange} required>
                  <option value="">Select...</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="af-field">
                <label>License Number</label>
                <input name="license_number" value={form.license_number} onChange={handleChange} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="af-field">
                <label>WhatsApp Number</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+20..." />
              </div>
              <div className="af-field">
                <label>Rating (out of 5)</label>
                <input name="rating" type="number" step="0.1" max="5" min="0" value={form.rating} onChange={handleChange} />
              </div>
            </div>
            <div className="af-field">
              <label>Bio (About Doctor)</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}></textarea>
            </div>
            <div className="af-field">
              <label>Image URL</label>
              <input
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://commons.wikimedia.org/wiki/Special:FilePath/..."
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#555', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'var(--gradient-primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DoctorAppointmentsModal({ doctorId, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null means show list, object means add/edit form
  const [saving, setSaving] = useState(false);
  const [deleteApptTarget, setDeleteApptTarget] = useState(null);

  const fetchAppts = () => {
    setLoading(true);
    axios.get(`${host}/doctor/Appointments/${doctorId}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then(res => setData(res.data?.data?.rows || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppts(); }, [doctorId]);

  const handleDelete = (id) => setDeleteApptTarget(id);

  const executeDeleteAppt = async () => {
    const id = deleteApptTarget;
    setDeleteApptTarget(null);
    try {
      await axios.delete(`${host}/doctor/Appointments/${id}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      showToast('Deleted successfully', 'success');
      fetchAppts();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.availability_id) {
        await axios.put(`${host}/doctor/Appointments/${form.availability_id}`, form, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      } else {
        await axios.post(`${host}/doctor/addAppointment`, { ...form, doctor_id: doctorId }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      }
      showToast('Saved successfully ✅', 'success');
      setForm(null);
      fetchAppts();
    } catch (err) { showToast(err.response?.data?.msg || err.response?.data?.message || err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, width: '90%', maxWidth: 540, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--section-head-color)' }}>Doctor Appointments</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#555' }}><MdClose /></button>
        </div>

        {form ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: 0, color: 'var(--main-color)' }}>{form.availability_id ? 'Edit Slot' : 'Add Slot'}</h4>
            <div className="af-field">
              <label>Day</label>
              <select value={form.available_day} onChange={e => setForm({...form, available_day: e.target.value})} required>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="af-field"><label>Start</label><input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required /></div>
              <div className="af-field"><label>End</label><input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setForm(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 10, border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.7rem', borderRadius: 10, border: 'none', background: 'var(--gradient-primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}><MdSave /> Save</button>
            </div>
          </form>
        ) : (
          <>
            <button onClick={() => setForm({ available_day: 'Sunday', start_time: '', end_time: '' })} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(54,64,206,0.1)', color: 'var(--main-color)', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', marginBottom: '1rem', width: '100%', justifyContent: 'center' }}><MdAdd /> Add New Slot</button>
            {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div> : data.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No appointments yet.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.map(item => (
                  <div key={item.availability_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid rgba(0,0,0,0.08)', padding: '0.75rem 1rem', borderRadius: 12 }}>
                    <div><strong style={{ display: 'block', color: 'var(--section-head-color)', marginBottom: '0.2rem' }}>{item.available_day}</strong><span style={{ fontSize: '0.9rem', color: '#666' }}>{item.start_time} - {item.end_time}</span></div>
                    <div className="tbl-actions">
                      <button className="tbl-btn edit" onClick={() => setForm(item)}><MdEdit /></button>
                      <button className="tbl-btn delete" onClick={() => handleDelete(item.availability_id)}><MdDelete /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteApptTarget}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment slot?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={executeDeleteAppt}
        onCancel={() => setDeleteApptTarget(null)}
      />
    </div>
  );
}

export default function DoctorsAdmin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [apptTarget, setApptTarget] = useState(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  function getAllDoctors() {
    setLoading(true);
    axios.get(`${host}/doctor/getAll`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => setData(res.data.data.rows))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { getAllDoctors(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { first_name, last_name, email, password, phone_number, specialization, license_number, verified, whatsapp, rating, bio } = form;
    if (!first_name || !last_name || !email || !password || !phone_number || !specialization || !license_number || !verified) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${host}/doctor/create`,
        { ...form, role: 'Doctor', rating: Number(rating) || 0 },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      showToast('Doctor added successfully ✅', 'success');
      addAdminNotification({ title: 'Doctor Added', message: `Dr. ${form.first_name} ${form.last_name} (${form.specialization}) was added.`, type: 'add', section: 'doctors' });
      setForm(EMPTY_FORM);
      setShowForm(false);
      getAllDoctors();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = (verified, id) => {
    axios.put(`${host}/doctor/verify/${id}`, { verified: !verified }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then(() => {
        showToast(`Doctor ${!verified ? 'verified' : 'unverified'} ✅`, 'success');
        addAdminNotification({ title: `Doctor ${!verified ? 'Verified' : 'Unverified'}`, message: `A doctor's verification status was changed.`, type: 'action', section: 'doctors' });
        setData((prev) => prev.map((d) => d.user_id === id ? { ...d, verified: !verified } : d));
      })
      .catch((err) => showToast(err.message, 'error'));
  };

  const handleDelete = () => {
    axios.delete(`${host}/doctor/delete/${deleteTarget}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then(() => { showToast('Doctor deleted ✅', 'success'); addAdminNotification({ title: 'Doctor Removed', message: 'A doctor was removed from the system.', type: 'delete', section: 'doctors' }); getAllDoctors(); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setDeleteTarget(null));
  };

  return (
    <div>
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2>Doctors</h2>
          <p>{data.length} doctor{data.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className={`btn-toggle-form ${showForm ? 'open' : ''}`} onClick={() => setShowForm(!showForm)}>
          <MdAdd /> {showForm ? 'Cancel' : 'Add Doctor'}
        </button>
      </div>

      {/* Inline Add Form */}
      <div className={`admin-form-panel ${showForm ? 'open' : ''}`}>
        <div className="admin-form-card">
          <form onSubmit={handleAdd}>
            <div className="admin-form-grid">
              <div className="af-field">
                <label>First Name *</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="e.g. Ahmed" />
              </div>
              <div className="af-field">
                <label>Last Name *</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="e.g. Hassan" />
              </div>
              <div className="af-field">
                <label>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="doctor@example.com" />
              </div>
              <div className="af-field">
                <label>Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
              </div>
              <div className="af-field">
                <label>Phone Number *</label>
                <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="+20..." />
              </div>
              <div className="af-field">
                <label>Specialization *</label>
                <select name="specialization" value={form.specialization} onChange={handleChange}>
                  <option value="">Select specialization…</option>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="af-field">
                <label>License Number *</label>
                <input name="license_number" value={form.license_number} onChange={handleChange} placeholder="e.g. LIC-12345" />
              </div>
              <div className="af-field">
                <label>Verified *</label>
                <select name="verified" value={form.verified} onChange={handleChange}>
                  <option value="">Choose status…</option>
                  <option value="true">Verified ✓</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>
              <div className="af-field">
                <label>WhatsApp Number</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+20..." />
              </div>
              <div className="af-field">
                <label>Rating (out of 5)</label>
                <input name="rating" type="number" step="0.1" max="5" min="0" value={form.rating} onChange={handleChange} />
              </div>
            </div>
            <div className="af-field">
              <label>Bio (About Doctor)</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Brief description about the doctor..."></textarea>
            </div>
            <div className="af-actions">
              <button type="button" className="af-btn-cancel" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</button>
              <button type="submit" className="af-btn-submit" disabled={submitting}>
                <FaUserDoctor /> {submitting ? 'Adding…' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="admin-loading">Loading doctors…</div>
      ) : data.length === 0 ? (
        <div className="admin-empty">No doctors found. Add your first doctor above.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((doc) => (
                <tr key={doc.user_id}>
                  <td>
                    <div className="tbl-name-cell">
                      {doc.image_url ? (
                        <Image src={doc.image_url} alt={doc.first_name} width={38} height={38} className="tbl-avatar" style={{ borderRadius: '50%' }} />
                      ) : (
                        <div className="tbl-avatar-placeholder">{doc.first_name?.charAt(0)}</div>
                      )}
                      <div>
                        <div className="name">{doc.first_name} {doc.last_name}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{doc.specialization}</span></td>
                  <td>
                    <Link href={`mailto:${doc.email}`} style={{ color: 'var(--main-color)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                      <MdEmail /> {doc.email}
                    </Link>
                  </td>
                  <td>
                    {doc.verified
                      ? <span className="badge badge-success"><MdVerified style={{ marginRight: 3 }} />Verified</span>
                      : <span className="badge badge-gray">Unverified</span>
                    }
                  </td>
                  <td>
                    <div className="tbl-actions">
                      <button className="tbl-btn edit" title="Edit" onClick={() => setEditTarget(doc.user_id)}><MdEdit /></button>
                      <button className="tbl-btn appt" title="Appointments" onClick={() => setApptTarget(doc.user_id)}><FaCalendarCheck /></button>
                      <button className={`tbl-btn ${doc.verified ? 'unverify' : 'verify'}`} title={doc.verified ? 'Unverify' : 'Verify'} onClick={() => handleVerify(doc.verified, doc.user_id)}>
                        {doc.verified ? <MdOutlineVerified /> : <MdVerified />}
                      </button>
                      <button className="tbl-btn delete" title="Delete" onClick={() => setDeleteTarget(doc.user_id)}><MdDelete /></button>
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
        title="Delete Doctor"
        message="Are you sure you want to permanently delete this doctor?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditDoctorModal
          docId={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={() => { setEditTarget(null); getAllDoctors(); }}
        />
      )}

      {apptTarget && (
        <DoctorAppointmentsModal
          doctorId={apptTarget}
          onClose={() => setApptTarget(null)}
        />
      )}
    </div>
  );
}
