'use client';
import './Navbar.css';
import Link from 'next/link';
import Image from 'next/image';
import logoImage from '../../assets/images/logo/logo.png';
import { FaUserDoctor } from 'react-icons/fa6';
import {
  MdMenu, MdHome, MdOutlineVaccines, MdPerson,
  MdAdminPanelSettings, MdMedication,
} from 'react-icons/md';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import NotificationBell from '../NotificationBell/NotificationBell';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { normalizeStoredUserIds, isAdminRole } from '@/lib/userIdentity';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const isAdminUser = isAdminRole(userRole);

  const refreshAuth = useCallback(() => {
    normalizeStoredUserIds();
    const role  = localStorage.getItem('Role');
    const name  = localStorage.getItem('Name');
    const token = localStorage.getItem('Token');
    const userId = localStorage.getItem('Id') || localStorage.getItem('AuthId');
    setUserRole(role || '');
    setUserName(name || '');
    setIsLoggedIn(!!(token && userId));
  }, []);

  /* Re-read auth on every route change so login/logout reflects immediately */
  useEffect(() => { refreshAuth(); }, [pathname, refreshAuth]);

  /* Also re-read when localStorage is changed from another tab */
  useEffect(() => {
    window.addEventListener('storage', refreshAuth);
    return () => window.removeEventListener('storage', refreshAuth);
  }, [refreshAuth]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      setIsLoggedIn(false);
      setUserRole('');
      router.push('/');
    }
  };

  /* Close mobile menu on route change */
  useEffect(() => {
    const menu = document.getElementById('mobile-menu');
    menu?.classList.remove('menuListMobile');
  }, [pathname]);

  const menuMobile = () => {
    const menu = document.getElementById('mobile-menu');
    menu?.classList.toggle('menuListMobile');
  };
  return (
    <nav>
      <div className="container">
        <Link href={isAdminUser ? '/adminDashboard' : '/'}>
          <Image
            src={logoImage}
            alt="Logo Image"
            className="m-0 img-fluid"
            priority
          />
        </Link>
        <div id="uls">
          <MdMenu className="barsMenu" onClick={menuMobile} />
          <ul>
            {isAdminUser ? (
              <li>
                <Link
                  href="/adminDashboard"
                  className={`nav-admin-btn ${pathname === '/adminDashboard' ? 'active-link' : ''}`}
                >
                  Admin Dashboard
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link href={'/'} prefetch={true} className={pathname === '/' ? 'active-link' : ''}>Home</Link>
                </li>
                <li>
                  <Link href={'/doctors'} prefetch={true} className={pathname === '/doctors' || pathname?.startsWith('/doctors/') ? 'active-link' : ''}>Doctors</Link>
                </li>
                <li>
                  <Link href={'/vaccines'} prefetch={true} className={pathname === '/vaccines' || pathname?.startsWith('/vaccines/') ? 'active-link' : ''}>Vaccinations</Link>
                </li>
                <li>
                  <Link href={'/doses'} prefetch={true} className={pathname === '/doses' || pathname?.startsWith('/doses/') ? 'active-link' : ''}>Doses</Link>
                </li>
                <li>
                  <Link href={'/medicine'} prefetch={true} className={pathname === '/medicine' || pathname?.startsWith('/medicine/') ? 'active-link' : ''}>Medicine</Link>
                </li>
              </>
            )}
            {isLoggedIn && !isAdminUser && (
              <li className="nb-nav-item">
                <NotificationBell />
              </li>
            )}
            {isLoggedIn ? (
              <li className="user-dropdown-container" ref={dropdownRef}>
                <div
                  className="user-avatar"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="avatar-circle">{userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
                  <span className="avatar-name">{userName ? userName.split(' ')[0] : 'User'}</span>
                  <span className="avatar-arrow">▼</span>
                </div>
                
                {isDropdownOpen && (
                  <div className="user-dropdown-menu">
                    {!isAdminUser && (
                      <Link href={'/profile'} onClick={() => setIsDropdownOpen(false)}>
                        <MdPerson className="dropdown-icon" /> Profile
                      </Link>
                    )}
                    <button onClick={() => setShowLogoutModal(true)} className="dropdown-logout-btn">
                      Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <li className="auth-buttons">
                <Link href={'/signin'} className="btn-signin">Sign In</Link>
                <Link href={'/signup'} className="btn-signup">Create Account</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div id="uls-mobile">
        <ul id="mobile-menu">
          {isAdminUser ? (
              <li>
                <Link
                  href="/adminDashboard"
                  onClick={menuMobile}
                  className={`mobile-admin-btn ${pathname === '/adminDashboard' ? 'active-link' : ''}`}
                >
                  <MdAdminPanelSettings />
                Admin Dashboard
                </Link>
            </li>
          ) : (
            <>
              <li>
                <Link href={'/'} prefetch={true} onClick={menuMobile} className={pathname === '/' ? 'active-link' : ''}>
                  <MdHome />Home
                </Link>
              </li>
              <li>
                <Link href={'/doctors'} prefetch={true} onClick={menuMobile} className={pathname === '/doctors' || pathname?.startsWith('/doctors/') ? 'active-link' : ''}>
                  <FaUserDoctor />Doctors
                </Link>
              </li>
              <li>
                <Link href={'/vaccines'} prefetch={true} onClick={menuMobile} className={pathname === '/vaccines' || pathname?.startsWith('/vaccines/') ? 'active-link' : ''}>
                  <MdOutlineVaccines />Vaccinations
                </Link>
              </li>
              <li>
                <Link href={'/doses'} prefetch={true} onClick={menuMobile} className={pathname === '/doses' || pathname?.startsWith('/doses/') ? 'active-link' : ''}>
                  <MdOutlineVaccines />Doses
                </Link>
              </li>
              <li>
                <Link href={'/medicine'} prefetch={true} onClick={menuMobile} className={pathname === '/medicine' || pathname?.startsWith('/medicine/') ? 'active-link' : ''}>
                  <MdMedication />Medicine
                </Link>
              </li>
            </>
          )}
          {isLoggedIn && (
            <li className="mobile-user-section">
              <div className="mobile-avatar">
                <div className="avatar-circle">{userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
                <span>{userName}</span>
              </div>
              {!isAdminUser && (
                <Link href={'/profile'} onClick={menuMobile}>
                  <MdPerson />
                  Profile
                </Link>
              )}
              <button onClick={() => setShowLogoutModal(true)} className="mobile-logout-btn">
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>

      <ConfirmModal 
        isOpen={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </nav>
  );
}
