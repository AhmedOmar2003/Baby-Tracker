'use client';
import './adminDashboard.css';
import { FaUserDoctor } from 'react-icons/fa6';
import {
  MdArticle, MdMedication, MdOutlineVaccines, MdCalendarToday,
  MdDashboard, MdSettings, MdPeopleAlt, MdChildCare, MdMenu,
  MdLock, MdEmail, MdShield, MdArrowBack, MdVisibility, MdVisibilityOff,
} from 'react-icons/md';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageTitle from '@/Components/PageTitle/PageTitle';
import MainDashboard from '@/Components/AdminDashboard/mainDashboard/page';
import DoctorsAdmin from '@/Components/AdminDashboard/doctors/Doctors';
import ArticlesDashboard from '@/Components/AdminDashboard/articles/ArticlesDashboard';
import Medicines from '@/Components/AdminDashboard/medicines/Medicines';
import Vaccines from '@/Components/AdminDashboard/vaccines/Vaccines';
import Doses from '@/Components/AdminDashboard/doses/Doses';
import UsersAdmin from '@/Components/AdminDashboard/users/UsersAdmin';
import ChildrenAdmin from '@/Components/AdminDashboard/children/ChildrenAdmin';
import { showToast } from '@/Components/Toast/Toast';
import { deriveAppUserId, isAdminRole, normalizeRole } from '@/lib/userIdentity';
import { supabase } from '@/lib/supabase';
import adminImage from '../../assets/images/admin/admin.jpg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const superAdminEmail = 'admin@admin.com';

function AdminLoginPanel({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      showToast('Email and password are required.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(
          data?.msg || data?.error_description || data?.message || 'Invalid login credentials.',
          'error'
        );
        return;
      }

      const session = data;
      const user = data?.user;
      const role = normalizeRole(
        user?.user_metadata?.role || (normalizedEmail === superAdminEmail ? 'SuperAdmin' : 'user')
      );

      if (!isAdminRole(role)) {
        await supabase.auth.signOut();
        showToast('This account is not allowed to access admin dashboard.', 'warning');
        return;
      }

      if (session?.access_token && session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      if (user) {
        localStorage.setItem('Token', session.access_token);
        localStorage.setItem('Role', role);
        localStorage.setItem('AuthId', user.id);
        localStorage.setItem('Id', deriveAppUserId(user.id));
        localStorage.setItem(
          'Name',
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()
        );
        localStorage.setItem('Email', user.email || '');
        localStorage.setItem('Phone', user.user_metadata?.phone_number || '');
        document.cookie = `role=${role};path=/;SameSite=Lax`;
      }

      showToast('Welcome to the admin dashboard.', 'success');
      onLogin();
    } catch (error) {
      showToast(error?.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [showPass, setShowPass] = useState(false);

  return (
    <div className="adm-login-page">
      {/* Decorative blobs */}
      <div className="adm-blob adm-blob-1" />
      <div className="adm-blob adm-blob-2" />
      <div className="adm-blob adm-blob-3" />

      <div className="adm-login-card">
        {/* Shield icon */}
        <div className="adm-shield-wrap">
          <MdShield className="adm-shield-icon" />
        </div>

        {/* Header */}
        <div className="adm-restricted-badge">Restricted Access</div>
        <h1 className="adm-title">Admin Portal</h1>
        <p className="adm-subtitle">
          Baby Tracker Control Center — authorised personnel only.
        </p>

        {/* Form */}
        <form className="adm-form" onSubmit={handleSubmit}>
          <div className="adm-field">
            <label>Email address</label>
            <div className="adm-input-wrap">
              <MdEmail className="adm-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@admin.com"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="adm-field">
            <label>Password</label>
            <div className="adm-input-wrap">
              <MdLock className="adm-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="adm-eye-btn"
                onClick={() => setShowPass((p) => !p)}
                tabIndex={-1}
              >
                {showPass ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="adm-submit-btn">
            {loading ? (
              <span className="adm-spinner" />
            ) : (
              <><MdShield /> Sign In to Dashboard</>
            )}
          </button>
        </form>

        {/* Back link */}
        <Link href="/" className="adm-back-link">
          <MdArrowBack /> Back to website
        </Link>
      </div>
    </div>
  );
}

import Settings from '@/Components/AdminDashboard/settings/Settings';
import ReservationsAdmin from '@/Components/AdminDashboard/reservations/ReservationsAdmin';
import ChildDosesAdmin from '@/Components/AdminDashboard/childDoses/ChildDosesAdmin';
import AdminNotificationBell from '@/Components/AdminDashboard/AdminNotificationBell';
import { MdSearch } from 'react-icons/md';

function AdminShell({ onLogout }) {
  const [active, setActive] = useState('mainDashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  const NAV_ITEMS = [
    { key: 'mainDashboard',  label: 'Dashboard',    icon: MdDashboard },
    { key: 'users',          label: 'Users',        icon: MdPeopleAlt },
    { key: 'children',       label: 'Children',     icon: MdChildCare },
    { key: 'doctors',        label: 'Doctors',      icon: FaUserDoctor },
    { key: 'reservations',   label: 'Reservations', icon: MdCalendarToday },
    { key: 'medicine',       label: 'Medicines',    icon: MdMedication },
    { key: 'vaccines',       label: 'Vaccines',     icon: MdOutlineVaccines },
    { key: 'doses',          label: 'Doses',        icon: MdCalendarToday },
    { key: 'childDoses',     label: 'Vacc. History', icon: MdOutlineVaccines },
    { key: 'articles',       label: 'Articles',     icon: MdArticle },
    { key: 'settings',       label: 'Settings',     icon: MdSettings },
  ];

  const searchResults = globalSearch.trim().length > 0
    ? NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : [];
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setAdminName(localStorage.getItem('Name') || 'Admin');
  }, []);

  // Listen for navigation events from AdminNotificationBell
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) handleMenuClick(e.detail);
    };
    window.addEventListener('bt:admin_goto', handler);
    return () => window.removeEventListener('bt:admin_goto', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      localStorage.removeItem('Token');
      localStorage.removeItem('Id');
      localStorage.removeItem('AuthId');
      localStorage.removeItem('Role');
      localStorage.removeItem('Name');
      localStorage.removeItem('Email');
      localStorage.removeItem('Phone');
      document.cookie = 'role=;path=/;Max-Age=0';
      setShowLogoutConfirm(false);
      onLogout?.();
    }
  };

  const todayDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const handleMenuClick = (menuItem) => {
    setActive(menuItem);
    setSidebarVisible(false);
  };

  return (
    <div className="admin-layout">
      {/* Mobile Toggle */}
      <div className="admin-mobile-header">
        <MdMenu className="mobile-toggle" onClick={() => setSidebarVisible(!sidebarVisible)} />
        <div className="mobile-logo">Baby Tracker Admin</div>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarVisible ? 'show' : ''}`}>
        <div className="sidebar-brand">
          <h2>Dashboard</h2>
        </div>
        
        <ul className="sidebar-menu">
          <li className="menu-group-label">Overview</li>
          <li onClick={() => handleMenuClick('mainDashboard')} className={active === 'mainDashboard' ? 'active' : ''}>
            <MdDashboard className="menu-icon" /> <span>Main Dashboard</span>
          </li>

          <li className="menu-group-label">People</li>
          <li onClick={() => handleMenuClick('users')} className={active === 'users' ? 'active' : ''}>
            <MdPeopleAlt className="menu-icon" /> <span>Users</span>
          </li>
          <li onClick={() => handleMenuClick('children')} className={active === 'children' ? 'active' : ''}>
            <MdChildCare className="menu-icon" /> <span>Children</span>
          </li>

          <li className="menu-group-label">Medical Data</li>
          <li onClick={() => handleMenuClick('doctors')} className={active === 'doctors' ? 'active' : ''}>
            <FaUserDoctor className="menu-icon" /> <span>Doctors</span>
          </li>
          <li onClick={() => handleMenuClick('reservations')} className={active === 'reservations' ? 'active' : ''}>
            <MdCalendarToday className="menu-icon" /> <span>Reservations</span>
          </li>
          <li onClick={() => handleMenuClick('medicine')} className={active === 'medicine' ? 'active' : ''}>
            <MdMedication className="menu-icon" /> <span>Medicines</span>
          </li>
          <li onClick={() => handleMenuClick('vaccines')} className={active === 'vaccines' ? 'active' : ''}>
            <MdOutlineVaccines className="menu-icon" /> <span>Vaccines</span>
          </li>
          <li onClick={() => handleMenuClick('doses')} className={active === 'doses' ? 'active' : ''}>
            <MdCalendarToday className="menu-icon" /> <span>Doses</span>
          </li>
          <li onClick={() => handleMenuClick('childDoses')} className={active === 'childDoses' ? 'active' : ''}>
            <MdOutlineVaccines className="menu-icon" /> <span>Vacc. History</span>
          </li>

          <li className="menu-group-label">Content</li>
          <li onClick={() => handleMenuClick('articles')} className={active === 'articles' ? 'active' : ''}>
            <MdArticle className="menu-icon" /> <span>Articles</span>
          </li>
        </ul>

        <div className="sidebar-bottom">
          <ul>
            <li onClick={() => handleMenuClick('settings')} className={active === 'settings' ? 'active' : ''}>
              <MdSettings className="menu-icon" /> <span>Settings</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Area */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <div className="topbar-date">{todayDate}</div>
            <div className="topbar-search" style={{ position: 'relative' }}>
              <MdSearch className="search-icon" />
              <input
                type="text"
                placeholder="Go to section..."
                value={globalSearch}
                onChange={(e) => { setGlobalSearch(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((item) => (
                    <button
                      key={item.key}
                      className="search-result-item"
                      onMouseDown={() => { handleMenuClick(item.key); setGlobalSearch(''); setShowSearchResults(false); }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="topbar-right">
            <AdminNotificationBell />
            <div className="admin-profile">
              <div className="avatar">{adminName.charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <span className="profile-name">{adminName}</span>
                <span className="profile-role">Super Admin</span>
              </div>
            </div>
            <button className="dashboard-logout-btn" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="admin-content-wrapper">
          <div className="content">
            {active === 'mainDashboard' && <MainDashboard />}
            {active === 'doctors' && <DoctorsAdmin />}
            {active === 'articles' && <ArticlesDashboard />}
            {active === 'medicine' && <Medicines />}
            {active === 'vaccines' && <Vaccines />}
            {active === 'doses' && <Doses />}
            {active === 'users' && <UsersAdmin />}
            {active === 'children' && <ChildrenAdmin />}
            {active === 'reservations' && <ReservationsAdmin />}
            {active === 'childDoses'   && <ChildDosesAdmin />}
            {active === 'settings' && <Settings />}
          </div>
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {sidebarVisible && <div className="sidebar-overlay" onClick={() => setSidebarVisible(false)}></div>}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-overlay-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Sign out</h4>
            <p>Are you sure you want to log out of the admin dashboard?</p>
            <div className="logout-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleLogout}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const cachedRole = localStorage.getItem('Role');
        const cachedToken = localStorage.getItem('Token');

        if (isAdminRole(cachedRole) && cachedToken) {
          if (mounted) setIsAdminAuthenticated(true);
          return;
        }

        const { data } = await supabase.auth.getUser();
        const sessionRole = normalizeRole(data?.user?.user_metadata?.role || '');

        if (isAdminRole(sessionRole)) {
          localStorage.setItem('Role', sessionRole);
          localStorage.setItem('Token', localStorage.getItem('Token') || '');
          if (mounted) setIsAdminAuthenticated(true);
          return;
        }

        if (mounted) setIsAdminAuthenticated(false);
      } catch {
        if (mounted) setIsAdminAuthenticated(false);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-card">
          <div className="dashboard-loading-title">Preparing admin area...</div>
          <div className="dashboard-loading-subtitle">Checking whether you already have admin access.</div>
        </div>
      </div>
    );
  }

  return isAdminAuthenticated ? (
    <AdminShell onLogout={() => setIsAdminAuthenticated(false)} />
  ) : (
    <AdminLoginPanel onLogin={() => setIsAdminAuthenticated(true)} />
  );
}
