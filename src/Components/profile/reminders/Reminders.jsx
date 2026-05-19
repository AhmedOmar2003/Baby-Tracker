import { useEffect, useMemo, useState } from 'react';
import './reminders.css';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import PageTitle from '@/Components/PageTitle/PageTitle';
import Spinner from '@/Components/Spinner/Spinner';
import { normalizeStoredUserIds } from '@/lib/userIdentity';

const STATUS_PRIORITY = {
  pending: 1,
  upcoming: 1,
  due: 2,
  active: 2,
  completed: 4,
  cancelled: 5,
};

function normalizeStatus(value) {
  return `${value || ''}`.trim().toLowerCase();
}

function getDoseStateClass(status) {
  switch (normalizeStatus(status)) {
    case 'completed':  return 'done';
    case 'cancelled':  return 'danger';
    case 'active':
    case 'administered': return 'done';
    default:           return 'warn';   // pending / upcoming / due
  }
}

function getBookingStateClass(status) {
  switch (normalizeStatus(status)) {
    case 'confirmed':  return 'done';
    case 'completed':  return 'info';
    case 'cancelled':  return 'danger';
    default:           return 'warn';   // pending
  }
}

function parseDateScore(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return Number.MAX_SAFE_INTEGER;
  return parsed.getTime();
}

function getStatusScore(value) {
  return STATUS_PRIORITY[normalizeStatus(value)] || 3;
}

function sortByUrgency(a, b) {
  const statusDiff = getStatusScore(a.status) - getStatusScore(b.status);
  if (statusDiff !== 0) return statusDiff;
  return parseDateScore(a.sortDate) - parseDateScore(b.sortDate);
}

function ReminderCard({ title, items, emptyText, colorClass }) {
  return (
    <section className="reminder-block">
      <div className="reminder-block-head">
        <h3>{title}</h3>
        <span className={`reminder-pill ${colorClass}`}>{items.length}</span>
      </div>

      {items.length > 0 ? (
        <div className="reminder-list">
          {items.map((item) => (
            <article className="reminder-card" key={item.key}>
              <div className="reminder-card-top">
                <strong>{item.title}</strong>
                <span className={`state ${item.stateClass}`}>{item.stateLabel}</span>
              </div>
              <p>{item.subtitle}</p>
              <div className="reminder-meta">
                {item.meta.map((metaItem) => (
                  <span key={metaItem}>{metaItem}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="reminder-empty">{emptyText}</div>
      )}
    </section>
  );
}

export default function Reminders() {
  const [loading, setLoading] = useState(false);
  const [doseReminders, setDoseReminders] = useState([]);
  const [bookingReminders, setBookingReminders] = useState([]);
  const [summary, setSummary] = useState({
    childrenCount: 0,
    upcomingDoses: 0,
    upcomingBookings: 0,
  });

  useEffect(() => {
    const loadReminders = async () => {
      const { appUserId } = normalizeStoredUserIds();
      const userId = appUserId || localStorage.getItem('Id');
      if (!userId) {
        showToast('Please log in again to view reminders.', 'warning');
        return;
      }

      setLoading(true);
      try {
        const childrenRes = await axios.get(`${host}/child/myChildren`, {
          headers: { 'Content-Type': 'application/json' },
          params: { user_id: userId },
          withCredentials: true,
        });
        const children = childrenRes?.data?.data?.rows || [];

        const childDoseResponses = await Promise.all(
          children.map((child) =>
            axios.get(`${host}/dose/childDoses/${child.child_id}`, {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true,
            })
          )
        );

        const allDoseItems = childDoseResponses.flatMap((response, index) => {
          const child = children[index];
          const rows = response?.data?.data?.rows || [];
          return rows.map((item) => ({
            ...item,
            key: `dose-${item.child_dose_id}`,
            title: item.dose_name || 'Dose reminder',
            subtitle: `${child.first_name || ''} ${child.last_name || ''}`.trim() || 'Child',
            stateLabel: item.status || 'Pending',
            stateClass: getDoseStateClass(item.status),
            sortDate: item.scheduled_date || item.administered_date || '',
            meta: [
              item.scheduled_date ? `Scheduled: ${item.scheduled_date}` : 'No scheduled date',
              item.doctor_first_name ? `Doctor: ${item.doctor_first_name}` : 'Doctor not assigned',
            ],
          }));
        });

        const reservationsRes = await axios.get(`${host}/reservation/myReservations`, {
          headers: { 'Content-Type': 'application/json' },
          params: { user_id: userId },
          withCredentials: true,
        });

        const reservations = reservationsRes?.data?.data?.rows || [];
        const nextBookings = reservations.map((item) => ({
          ...item,
          key: `reservation-${item.reservation_id}`,
          title: item.doctor_name || 'Doctor appointment',
          subtitle: item.child_name || 'Child not selected',
          stateLabel: item.status || 'Pending',
          stateClass: getBookingStateClass(item.status),
          sortDate: `${item.reservation_date || ''} ${item.reservation_time || ''}`.trim(),
          meta: [
            item.reservation_date ? `Date: ${item.reservation_date}` : 'No date',
            item.reservation_time ? `Time: ${item.reservation_time}` : 'No time',
            item.reservation_day ? `Day: ${item.reservation_day}` : 'No day',
          ],
        }));

        const upcomingDoseItems = allDoseItems
          .filter((item) => normalizeStatus(item.stateLabel) !== 'completed')
          .sort(sortByUrgency)
          .slice(0, 4);

        const upcomingBookingItems = nextBookings
          .filter((item) => normalizeStatus(item.stateLabel) !== 'cancelled')
          .sort(sortByUrgency)
          .slice(0, 4);

        setDoseReminders(upcomingDoseItems);
        setBookingReminders(upcomingBookingItems);
        setSummary({
          childrenCount: children.length,
          upcomingDoses: upcomingDoseItems.length,
          upcomingBookings: upcomingBookingItems.length,
        });
      } catch (error) {
        showToast(error?.response?.data?.msg || error?.message || 'Failed to load reminders.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, []);

  const nextDose = useMemo(() => doseReminders[0] || null, [doseReminders]);
  const nextBooking = useMemo(() => bookingReminders[0] || null, [bookingReminders]);

  return (
    <div className="reminders">
      <PageTitle
        text="Reminders"
        subtext="Your baby's next doses and appointments in one place."
      />

      <div className="reminder-summary">
        <div className="summary-card">
          <span>Children</span>
          <strong>{summary.childrenCount}</strong>
        </div>
        <div className="summary-card">
          <span>Upcoming doses</span>
          <strong>{summary.upcomingDoses}</strong>
        </div>
        <div className="summary-card">
          <span>Upcoming bookings</span>
          <strong>{summary.upcomingBookings}</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem 0', textAlign: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className="next-reminders">
            {nextDose ? (
              <article className="next-reminder-card dose">
                <span className="eyebrow">Next dose</span>
                <h4>{nextDose.title}</h4>
                <p>{nextDose.subtitle}</p>
                <div className="mini-meta">
                  {nextDose.meta.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
            ) : (
              <article className="next-reminder-card dose">
                <span className="eyebrow">Next dose</span>
                <h4>No dose reminder yet</h4>
                <p>Once the child has scheduled doses, we will show the closest one here.</p>
              </article>
            )}

            {nextBooking ? (
              <article className="next-reminder-card booking">
                <span className="eyebrow">Next appointment</span>
                <h4>{nextBooking.title}</h4>
                <p>{nextBooking.subtitle}</p>
                <div className="mini-meta">
                  {nextBooking.meta.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
            ) : (
              <article className="next-reminder-card booking">
                <span className="eyebrow">Next appointment</span>
                <h4>No appointment reminder yet</h4>
                <p>When you book a doctor visit, it will appear here automatically.</p>
              </article>
            )}
          </div>

          <div className="reminders-grid">
            <ReminderCard
              title="Dose reminders"
              items={doseReminders}
              emptyText="No upcoming dose reminders right now."
              colorClass="dose"
            />
            <ReminderCard
              title="Booking reminders"
              items={bookingReminders}
              emptyText="No upcoming doctor bookings right now."
              colorClass="booking"
            />
          </div>
        </>
      )}
    </div>
  );
}
