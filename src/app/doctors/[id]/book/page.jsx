'use client';

import { useEffect, useMemo, useState } from 'react';
import './doctorBook.css';
import axios from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import doctorImage from '../../../../assets/images/doctor/doctor.png';
import { MdArrowBack, MdEventAvailable, MdCalendarToday, MdCheckCircle, MdPerson, MdStar } from 'react-icons/md';
import { showToast } from '@/Components/Toast/Toast';
import { host } from '@/Components/utils/Host';
import Spinner from '@/Components/Spinner/Spinner';
import { normalizeStoredUserIds } from '@/lib/userIdentity';
import { addNotification } from '@/hooks/useNotifications';

export default function DoctorBookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('Token');
    if (!token) {
      showToast('You are not logged in.', 'warning');
      router.push('/signin');
      return;
    }

    const preselectedSlotId = searchParams.get('slot') || '';
    if (preselectedSlotId) setSelectedSlotId(preselectedSlotId);
    const preselectedChildId = searchParams.get('childId') || searchParams.get('child_id') || '';

    const { appUserId } = normalizeStoredUserIds();
    const userId = appUserId || localStorage.getItem('AuthId') || localStorage.getItem('Id');

    setLoading(true);
    Promise.all([
      axios.get(`${host}/doctor/${params.id}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true }),
      axios.get(`${host}/doctor/Appointments/${params.id}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true }),
      userId
        ? axios.get(`${host}/child/myChildren?user_id=${userId}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
        : Promise.resolve({ data: { data: { rows: [] } } }),
    ])
      .then(([doctorRes, appointmentsRes, childrenRes]) => {
        const nextDoctor = doctorRes.data?.data?.rows?.[0] || null;
        const nextAppointments = appointmentsRes.data?.data?.rows || [];
        const nextChildren = childrenRes.data?.data?.rows || [];

        setDoctor(nextDoctor);
        setAppointments(nextAppointments);
        setChildren(nextChildren);

        setSelectedChildId((current) => {
          if (current) return current;
          if (preselectedChildId) return preselectedChildId;
          if (nextChildren.length === 1) return `${nextChildren[0].child_id}`;
          return '';
        });

        const matchedSlot =
          nextAppointments.find((slot) => `${slot.availability_id}` === `${preselectedSlotId}`) ||
          nextAppointments.find(
            (slot) =>
              `${slot.available_day}` === `${searchParams.get('day') || ''}` &&
              `${slot.start_time}` === `${searchParams.get('time') || ''}`
          );

        if (matchedSlot) setSelectedSlotId(`${matchedSlot.availability_id}`);
      })
      .catch((error) => {
        showToast(`Connection error: ${error.message}`, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id, router, searchParams]);

  const selectedSlot = useMemo(
    () => appointments.find((slot) => `${slot.availability_id}` === `${selectedSlotId}`) || null,
    [appointments, selectedSlotId]
  );

  const selectedChild = useMemo(
    () => children.find((child) => `${child.child_id}` === `${selectedChildId}`) || null,
    [children, selectedChildId]
  );
  const canConfirmBooking = !!selectedChildId && !!selectedSlot && !saving;

  const handleConfirmBooking = async () => {
    if (!selectedChildId) {
      showToast('Please choose a child first.', 'warning');
      return;
    }
    if (!selectedSlot) {
      showToast('Please choose an appointment slot.', 'warning');
      return;
    }

    const { appUserId } = normalizeStoredUserIds();
    const userId = appUserId || localStorage.getItem('AuthId') || localStorage.getItem('Id');
    if (!userId) {
      showToast('Please login to continue.', 'warning');
      router.push('/signin');
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${host}/reservation/create`,
        {
          user_id: userId,
          doctor_id: doctor.user_id,
          child_id: selectedChildId,
          availability_id: selectedSlot.availability_id,
          reservation_day: selectedSlot.available_day,
          reservation_kind: 'Doctor appointment',
          reservation_date: selectedSlot.available_day,
          reservation_time: selectedSlot.start_time,
          notes: `Doctor appointment with ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim(),
          status: 'Pending',
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      addNotification({
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} on ${selectedSlot.available_day} at ${selectedSlot.start_time} is confirmed.`,
        type: 'reservation',
        link: '/profile?section=reservation',
      });
      showToast('Appointment booked successfully ✅', 'success');
      router.push('/profile');
    } catch (error) {
      showToast(error.response?.data?.msg || error.response?.data?.message || error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-book-page doctor-book-loading">
        <Spinner />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="doctor-book-page doctor-book-empty">
        <p>Doctor not found.</p>
        <button className="back-btn" onClick={() => router.back()}>
          <MdArrowBack /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="doctor-book-page">
      <div className="doctor-book-shell">
        <button className="back-btn" onClick={() => router.back()}>
          <MdArrowBack /> Back to Doctor
        </button>

        <section className="doctor-book-hero">
          <div className="doctor-book-photo">
            <img src={doctor.image_url || doctorImage.src} alt="Doctor" width={120} height={120} />
          </div>
          <div className="doctor-book-copy">
            <p className="eyebrow">Doctor booking</p>
            <h1>{doctor.first_name} {doctor.last_name}</h1>
            <p className="specialty">{doctor.specialization}</p>
            <div className="rating-row">
              <span className="star"><MdStar /></span>
              <span>{doctor.rating ? Number(doctor.rating).toFixed(1) : '4.5'} Rating</span>
            </div>
          </div>
          <div className="doctor-book-summary">
            <div className="summary-card">
              <MdCalendarToday />
              <span>Pick a time window, then choose a child to confirm the booking.</span>
            </div>
          </div>
        </section>

        <div className="doctor-book-grid">
          <section className="booking-panel">
            <h2><MdPerson /> Choose Child</h2>
            {children.length === 0 ? (
              <div className="empty-state">
                <p>You need to add a child first before booking a doctor appointment.</p>
                <button className="secondary-btn" onClick={() => router.push('/profile')}>
                  Go to Profile
                </button>
              </div>
            ) : (
              <>
                <p className="booking-hint" style={{ marginBottom: '0.75rem' }}>
                  Choose the child for this appointment. If you have only one child, we select it automatically.
                </p>
                <div className="children-list">
                  {children.map((child) => {
                    const childName = `${child.first_name || ''} ${child.last_name || ''}`.trim() || 'Child';
                    const active = `${selectedChildId}` === `${child.child_id}`;
                    return (
                      <button
                        key={child.child_id}
                        className={`child-pill ${active ? 'active' : ''}`}
                        onClick={() => setSelectedChildId(`${child.child_id}`)}
                        type="button"
                      >
                        <span>{childName}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <h2><MdEventAvailable /> Available Windows</h2>
            {appointments.length === 0 ? (
              <div className="empty-state">
                <p>No available appointment windows were found for this doctor.</p>
              </div>
            ) : (
              <div className="slot-list">
                {appointments.map((slot) => {
                  const active = `${selectedSlotId}` === `${slot.availability_id}`;
                  return (
                    <button
                      key={slot.availability_id}
                      type="button"
                      className={`slot-card ${active ? 'active' : ''}`}
                      onClick={() => setSelectedSlotId(`${slot.availability_id}`)}
                    >
                      <div>
                        <strong>{slot.available_day}</strong>
                        <span>{slot.start_time} - {slot.end_time}</span>
                      </div>
                      <MdCheckCircle />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="booking-summary">
            <h2>Booking Summary</h2>
            <div className="summary-box">
              <p><strong>Doctor:</strong> {doctor.first_name} {doctor.last_name}</p>
              <p><strong>Specialty:</strong> {doctor.specialization || 'General'}</p>
              <p><strong>Child:</strong> {selectedChild ? `${selectedChild.first_name || ''} ${selectedChild.last_name || ''}`.trim() : 'Not selected'}</p>
              <p><strong>Day:</strong> {selectedSlot?.available_day || 'Not selected'}</p>
              <p><strong>Time:</strong> {selectedSlot ? `${selectedSlot.start_time} - ${selectedSlot.end_time}` : 'Not selected'}</p>
            </div>
            <button className="confirm-btn" onClick={handleConfirmBooking} disabled={!canConfirmBooking}>
              {saving ? 'Booking...' : 'Confirm Booking'}
            </button>
            <p className="booking-hint">You can change the child or the time window before confirming.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
