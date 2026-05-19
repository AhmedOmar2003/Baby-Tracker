'use client';
import { useEffect, useState } from 'react';
import './doctorDetails.css';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import doctorImage from '../../../assets/images/doctor/doctor.png';
import { FaWhatsapp } from 'react-icons/fa6';
import { MdFavoriteBorder, MdFavorite, MdStar, MdPhone, MdEmail, MdEventAvailable, MdArrowBack } from 'react-icons/md';
import { showToast } from '@/Components/Toast/Toast';
import { host } from '@/Components/utils/Host';
import Spinner from '@/Components/Spinner/Spinner';

export default function DoctorDetails() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${host}/doctor/${params.id}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true }),
      axios.get(`${host}/doctor/Appointments/${params.id}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
    ]).then(([docRes, apptRes]) => {
      setData(docRes.data?.data?.rows?.[0] || null);
      setAppointments(apptRes.data?.data?.rows || []);
    }).catch((error) => {
      showToast(`Connection error: ${error.message}`, 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, [params.id]);

  const handleOpenBooking = () => {
    router.push(`/doctors/${params.id}/book`);
  };

  const handleChooseSlot = (slot) => {
    router.push(
      `/doctors/${params.id}/book?slot=${slot.availability_id}&day=${encodeURIComponent(slot.available_day)}&time=${encodeURIComponent(slot.start_time)}`
    );
  };

  if (loading) {
    return <div style={{ padding: '5rem', textAlign: 'center' }}><Spinner /></div>;
  }

  if (!data) {
    return <div style={{ padding: '5rem', textAlign: 'center' }}>Doctor not found</div>;
  }

  return (
    <div className="doctorDetails">
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button className="btn-outline" onClick={() => router.back()} style={{ marginBottom: '2rem' }}>
          <MdArrowBack /> Back to Doctors
        </button>

        <div className="doc-page-card">
          <div className="doc-page-header">
            <div className="doc-avatar">
              <img src={data.image_url || doctorImage.src} alt="Doctor" width={120} height={120} />
            </div>
            <div className="doc-title-info">
              <h2>{data.first_name} {data.last_name}</h2>
              <p className="spec">{data.specialization}</p>
              <div className="rate-wrap">
                <span className="star"><MdStar /></span>
                <span>{data.rating ? Number(data.rating).toFixed(1) : '4.5'} Rating</span>
              </div>
              <div className="doc-page-actions">
                <button className="btn-primary" onClick={handleOpenBooking}>
                  Open Booking
                </button>
                <span className="doc-page-note">Choose a time window from the list below</span>
              </div>
            </div>
          </div>

          <div className="doc-page-body">
            <div className="doc-section">
              <h3><MdFavorite /> About Doctor</h3>
              <p className="bio-text">{data.bio || 'This doctor is one of our top pediatric specialists dedicated to providing exceptional care for children and infants.'}</p>
            </div>

            <div className="doc-section contact-row">
              {data.email && (
                <a href={`mailto:${data.email}`} className="contact-btn email"><MdEmail /> Email</a>
              )}
              {data.whatsapp && (
                <a href={`https://wa.me/${data.whatsapp.replace('+', '')}`} target="_blank" rel="noreferrer" className="contact-btn whatsapp"><FaWhatsapp /> WhatsApp</a>
              )}
              {data.phone_number && (
                <a href={`tel:${data.phone_number}`} className="contact-btn phone"><MdPhone /> Call</a>
              )}
            </div>

            <div className="doc-section" id="appointments">
              <h3><MdEventAvailable /> Available Time Windows</h3>
              {appointments.length === 0 ? (
                <p style={{ color: '#888' }}>No available appointments found for this doctor.</p>
              ) : (
                <div className="appt-grid">
                  {appointments.map(slot => (
                    <div key={slot.availability_id} className="appt-card" onClick={() => handleChooseSlot(slot)}>
                      <div className="appt-info">
                        <strong>{slot.available_day}</strong>
                        <span>{slot.start_time} — {slot.end_time}</span>
                      </div>
                      <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleChooseSlot(slot); }}>Choose Slot</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
