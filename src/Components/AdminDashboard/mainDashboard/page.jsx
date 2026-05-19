'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { FaUserDoctor, FaUsers } from 'react-icons/fa6';
import { MdArticle, MdOutlineVaccines, MdMedication, MdCalendarToday, MdChildCare } from 'react-icons/md';
import Spinner from '@/Components/Spinner/Spinner';
import './mainDashboard.css';

export default function MainDashboard() {
  const [stats, setStats] = useState({
    doctors: 0, articles: 0, medicines: 0,
    vaccines: 0, doses: 0, users: 0,
    children: 0, reservations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchDashboardStats = async () => {
      try {
        const [doctorsRes, articlesRes, medicinesRes, vaccinesRes, dosesRes, usersRes, reservationsRes, childDosesRes] = await Promise.allSettled([
          axios.get(`${host}/doctor/getAll`,   { headers: { 'Content-Type': 'application/json' } }),
          axios.get(`${host}/article/getAll`,  { headers: { 'Content-Type': 'application/json' } }),
          axios.get(`${host}/medicine/getAll`, { headers: { 'Content-Type': 'application/json' } }),
          axios.get(`${host}/vaccine/getAll`,  { headers: { 'Content-Type': 'application/json' } }),
          axios.get(`${host}/dose/getAll`,     { headers: { 'Content-Type': 'application/json' } }),
          fetch('/api/admin/users').then(r => r.json()),
          axios.get(`${host}/reservation/all`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true }),
          axios.get(`${host}/child_dose/all`,  { headers: { 'Content-Type': 'application/json' }, withCredentials: true }),
        ]);

        if (mounted) {
          setStats({
            doctors:      doctorsRes.status      === 'fulfilled' ? (doctorsRes.value.data.data?.rows?.length      || 0) : 0,
            articles:     articlesRes.status     === 'fulfilled' ? (articlesRes.value.data.data?.rows?.length     || 0) : 0,
            medicines:    medicinesRes.status    === 'fulfilled' ? (medicinesRes.value.data.data?.rows?.length    || 0) : 0,
            vaccines:     vaccinesRes.status     === 'fulfilled' ? (vaccinesRes.value.data.data?.rows?.length     || 0) : 0,
            doses:        dosesRes.status        === 'fulfilled' ? (dosesRes.value.data.data?.rows?.length        || 0) : 0,
            users:        usersRes.status        === 'fulfilled' && usersRes.value.success ? usersRes.value.total  : 0,
            reservations: reservationsRes.status === 'fulfilled' ? (reservationsRes.value.data.data?.rows?.length || 0) : 0,
            children:     childDosesRes.status   === 'fulfilled' ? (childDosesRes.value.data.data?.rows?.length   || 0) : 0,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardStats();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="main-dashboard-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="main-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <p>A quick summary of the system's current status and metrics.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon-wrapper">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>{stats.users}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card doctors">
          <div className="stat-icon-wrapper">
            <FaUserDoctor />
          </div>
          <div className="stat-info">
            <h3>{stats.doctors}</h3>
            <p>Registered Doctors</p>
          </div>
        </div>

        <div className="stat-card articles">
          <div className="stat-icon-wrapper">
            <MdArticle />
          </div>
          <div className="stat-info">
            <h3>{stats.articles}</h3>
            <p>Published Articles</p>
          </div>
        </div>

        <div className="stat-card medicines">
          <div className="stat-icon-wrapper">
            <MdMedication />
          </div>
          <div className="stat-info">
            <h3>{stats.medicines}</h3>
            <p>Medicines DB</p>
          </div>
        </div>

        <div className="stat-card doses">
          <div className="stat-icon-wrapper">
            <MdCalendarToday />
          </div>
          <div className="stat-info">
            <h3>{stats.doses}</h3>
            <p>Available Doses</p>
          </div>
        </div>

        <div className="stat-card vaccines">
          <div className="stat-icon-wrapper">
            <MdOutlineVaccines />
          </div>
          <div className="stat-info">
            <h3>{stats.vaccines}</h3>
            <p>Vaccines DB</p>
          </div>
        </div>

        <div className="stat-card reservations">
          <div className="stat-icon-wrapper">
            <MdCalendarToday />
          </div>
          <div className="stat-info">
            <h3>{stats.reservations}</h3>
            <p>Total Reservations</p>
          </div>
        </div>

        <div className="stat-card children">
          <div className="stat-icon-wrapper">
            <MdChildCare />
          </div>
          <div className="stat-info">
            <h3>{stats.children}</h3>
            <p>Vaccination Records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
