'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import { MdArrowBack, MdDelete, MdEdit, MdAdd, MdClose, MdSave } from 'react-icons/md';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import '@/Components/AdminDashboard/adminSection.css';
import './appointment.css';

const EMPTY_APPT = { available_day: 'Sunday', start_time: '', end_time: '' };

function AppointmentModal({ appt, doctorId, onClose, onSave }) {
  const [form, setForm] = useState(appt || EMPTY_APPT);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (appt) {
        // Edit existing
        await axios.put(`${host}/doctor/Appointments/${appt.availability_id}`, {
          available_day: form.available_day,
          start_time: form.start_time,
          end_time: form.end_time,
        }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
        showToast('Appointment updated successfully ✅', 'success');
      } else {
        // We assume there's a POST endpoint to add a new appointment
        try {
          await axios.post(`${host}/doctor/addAppointment`, {
            doctor_id: doctorId,
            available_day: form.available_day,
            start_time: form.start_time,
            end_time: form.end_time,
          }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
          showToast('Appointment added successfully ✅', 'success');
        } catch (addErr) {
          showToast(addErr.response?.data?.msg || addErr.response?.data?.message || addErr.message, 'error');
        }
      }
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, width: '90%', maxWidth: 450, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--section-head-color)' }}>
            {appt ? 'Edit Appointment' : 'Add Appointment'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#555' }}><MdClose /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="af-field">
            <label>Available Day</label>
            <select name="available_day" value={form.available_day} onChange={handleChange} required>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="af-field">
            <label>Start Time</label>
            <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required />
          </div>
          <div className="af-field">
            <label>End Time</label>
            <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#555', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'var(--gradient-primary)', color: 'white', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <MdSave /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppointmentDoctor() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalAppt, setModalAppt] = useState(undefined); // undefined=closed, null=add, obj=edit

  const fetchAppointments = () => {
    setLoading(true);
    axios.get(`${host}/doctor/Appointments/${params.id}`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    })
      .then((res) => {
        setData(res.data?.data?.rows || []);
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDelete = async () => {
    try {
      await axios.delete(`${host}/doctor/Appointments/${deleteTarget}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      showToast('Appointment deleted ✅', 'success');
      fetchAppointments();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="appointment" style={{ padding: '2rem' }}>
      <div className="admin-section-header">
        <div>
          <h2>Doctor Appointments</h2>
          <p>Manage schedule and availability for this doctor</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-toggle-form" onClick={() => router.push('/adminDashboard')} style={{ background: 'white', color: '#555', border: '1.5px solid rgba(0,0,0,0.1)' }}>
            <MdArrowBack /> Back to Admin
          </button>
          <button className="btn-toggle-form" onClick={() => setModalAppt(null)}>
            <MdAdd /> Add Slot
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading appointments...</div>
      ) : data.length === 0 ? (
        <div className="admin-empty">No appointments found for this doctor.</div>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: '1.5rem' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Available Day</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.availability_id}>
                  <td><span className="badge badge-info">{item.available_day}</span></td>
                  <td style={{ fontWeight: 600 }}>{item.start_time}</td>
                  <td style={{ fontWeight: 600 }}>{item.end_time}</td>
                  <td>
                    <div className="tbl-actions">
                      <button className="tbl-btn edit" onClick={() => setModalAppt(item)} title="Edit"><MdEdit /></button>
                      <button className="tbl-btn delete" onClick={() => setDeleteTarget(item.availability_id)} title="Delete"><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAppt !== undefined && (
        <AppointmentModal
          appt={modalAppt}
          doctorId={params.id}
          onClose={() => setModalAppt(undefined)}
          onSave={() => { setModalAppt(undefined); fetchAppointments(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Appointment"
        message="Are you sure you want to permanently delete this appointment schedule?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
