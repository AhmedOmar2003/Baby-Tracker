'use client';
import { useEffect, useState } from 'react';
import './reserve.css';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import Spinner from '@/Components/Spinner/Spinner';
import { normalizeStoredUserIds } from '@/lib/userIdentity';
import { addNotification } from '@/hooks/useNotifications';
import {
  MdLocalHospital, MdCalendarToday, MdAccessTime,
  MdOutlineVaccines, MdCheckCircle, MdArrowBack,
} from 'react-icons/md';

const getErrMsg = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.msg || err?.response?.data?.message || err?.message || fallback;

export default function Reserve() {
  const params = useParams();
  const router = useRouter();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [tableDoctor, setTableDoctor] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const uniqueDays = [...new Set(tableDoctor.map((a) => a.available_day))];
  const today = new Date().toISOString().split('T')[0];

  function fetchDoctors() {
    axios
      .get(`${host}/doctor/getAll`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => setDoctors(res.data.data.rows || []))
      .catch((err) => showToast(getErrMsg(err, 'Failed to load doctors.'), 'error'))
      .finally(() => setLoading(false));
  }

  function fetchAppointments(id) {
    axios
      .get(`${host}/doctor/Appointments/${id}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => {
        setTableDoctor(res.data.data.rows || []);
        setSelectedDay('');
        setAppointments([]);
        setSelectedSlot(null);
      })
      .catch((err) => showToast(getErrMsg(err, 'Failed to load appointments.'), 'error'));
  }

  const handleDoctorChange = (e) => {
    const opt = e.target.selectedOptions[0];
    const id = opt.getAttribute('data-id');
    setDoctorId(id);
    setDoctorName(opt.text);
    fetchAppointments(id);
  };

  const handleDayChange = (e) => {
    const day = e.target.value;
    setSelectedDay(day);
    setSelectedSlot(null);
    setAppointments(tableDoctor.filter((a) => a.available_day === day));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!doctorId || !selectedDay || !selectedDate || !selectedSlot) {
      showToast('Please complete all reservation details.', 'warning');
      return;
    }

    const { appUserId } = normalizeStoredUserIds();
    const userId = appUserId || localStorage.getItem('Id');
    if (!userId) {
      showToast('Please log in again before reserving.', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      user_id: userId,
      doctor_id: doctorId,
      child_id: params.childId,
      child_dose_id: params.doseId,
      reservation_day: selectedDay,
      reservation_kind: 'Dose reservation',
      reservation_date: selectedDate,
      reservation_time: selectedSlot.start_time,
      availability_id: selectedSlot.availability_id || null,
    };

    axios
      .post(`${host}/reservation/create`, payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .then(() => {
        addNotification({
          title: 'Dose Reservation Confirmed',
          message: `Appointment with ${doctorName} on ${selectedDay} (${selectedDate}) at ${selectedSlot.start_time} was booked.`,
          type: 'reservation',
          link: '/profile?section=reservation',
        });
        showToast('Reservation created successfully!', 'success');
        router.push('/profile');
      })
      .catch((err) => showToast(getErrMsg(err, 'Failed to create reservation.'), 'error'))
      .finally(() => setSubmitting(false));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  if (loading) return <Spinner />;

  const step = !doctorId ? 1 : !selectedDay ? 2 : !selectedSlot ? 3 : 4;

  return (
    <div className="reserve">
      <div className="container">

        {/* Header */}
        <div className="reserve-header">
          <div className="reserve-header-icon"><MdOutlineVaccines /></div>
          <h2>Book Dose Appointment</h2>
          <p>Select a doctor and available time slot for your child&apos;s dose</p>
        </div>

        {/* Step indicator */}
        <div className="reserve-steps">
          {['Doctor', 'Day', 'Time Slot', 'Confirm'].map((label, i) => (
            <div key={i} className={`step ${step > i ? 'done' : step === i + 1 ? 'active' : ''}`}>
              <div className="step-circle">
                {step > i + 1 ? <MdCheckCircle /> : i + 1}
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Doctor */}
          <div className="form-group">
            <label><MdLocalHospital /> Select Doctor</label>
            <select defaultValue="" onChange={handleDoctorChange}>
              <option value="" disabled hidden>Choose a doctor...</option>
              {doctors.map((d) => (
                <option value={`${d.first_name} ${d.last_name}`} key={d.user_id} data-id={d.user_id}>
                  Dr. {d.first_name} {d.last_name}
                  {d.specialization ? ` — ${d.specialization}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Day */}
          {doctorId && (
            uniqueDays.length > 0 ? (
              <div className="form-group">
                <label><MdCalendarToday /> Select Available Day</label>
                <select value={selectedDay} onChange={handleDayChange}>
                  <option value="" disabled hidden>Choose a day...</option>
                  {uniqueDays.map((day, i) => (
                    <option value={day} key={i}>{day}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="no-slots-msg">No available appointments for this doctor yet.</p>
            )
          )}

          {/* Step 3: Date + Time slots */}
          {selectedDay && (
            <>
              <div className="form-group">
                <label><MdCalendarToday /> Appointment Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {appointments.length > 0 && (
                <div className="form-group">
                  <label><MdAccessTime /> Select Time Slot</label>
                  <div className="slots-grid">
                    {appointments.map((slot, i) => (
                      <button
                        type="button"
                        key={i}
                        className={`slot-btn ${selectedSlot?.start_time === slot.start_time ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <MdAccessTime className="slot-clock" />
                        <span className="slot-time">{slot.start_time}</span>
                        <span className="slot-sep">–</span>
                        <span className="slot-time">{slot.end_time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Summary card */}
          {selectedSlot && selectedDate && (
            <div className="reserve-summary">
              <h4>Reservation Summary</h4>
              <div className="summary-row"><span>Doctor</span><strong>{doctorName}</strong></div>
              <div className="summary-row"><span>Day</span><strong>{selectedDay}</strong></div>
              <div className="summary-row"><span>Date</span><strong>{selectedDate}</strong></div>
              <div className="summary-row"><span>Time</span><strong>{selectedSlot.start_time} – {selectedSlot.end_time}</strong></div>
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <Link href={`/profile/childDosesByChildId/${params.childId}`} className="back-btn">
              <MdArrowBack /> Back
            </Link>
            <button type="submit" className="submit-btn" disabled={submitting || !selectedSlot || !selectedDate}>
              {submitting ? 'Booking...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
