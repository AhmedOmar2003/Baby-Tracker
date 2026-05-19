'use client';
import './profile.css';
import '../../Components/profile/sidebar/sidebar.css';
import {
  MdSettings, MdChevronRight, MdNotifications, MdPersonAdd,
  MdLogout, MdEdit, MdCalendarToday, MdFavorite,
} from 'react-icons/md';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PersonalAccount from '@/Components/profile/personalAccount/PersonalAccount';
import Children from '@/Components/profile/children/Children';
import AddChild from '@/Components/profile/addChild/AddChild';
import Reservation from '@/Components/profile/reservation/Reservation';
import Favorites from '@/Components/profile/favorites/Favorites';
import Reminders from '@/Components/profile/reminders/Reminders';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { showToast } from '@/Components/Toast/Toast';
import { supabase } from '@/lib/supabase';
import { normalizeStoredUserIds } from '@/lib/userIdentity';

const VALID_SECTIONS = ['personalAccount', 'addChild', 'children', 'reminders', 'reservation', 'favorites'];

export default function Profile() {
  const [data, setData] = useState('personalAccount');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  /* Sync section from URL on mount + when URL ?section= changes */
  useEffect(() => {
    const token = localStorage.getItem('Token');
    if (!token) {
      showToast(`You are not logged in.`, 'warning');
      router.push('/signin');
      return;
    }
    normalizeStoredUserIds();
    const section = searchParams.get('section');
    if (section && VALID_SECTIONS.includes(section)) {
      setData(section);
    }
    setIsAuthenticated(true);
  }, [searchParams, router]);

  /* Switch tab and keep URL in sync so refresh/share works */
  const switchSection = useCallback((section) => {
    setData(section);
    router.replace(`/profile?section=${section}`, { scroll: false });
  }, [router]);

  const handleLogOut = () => {
    supabase.auth
      .signOut()
      .then(() => {
        localStorage.removeItem('Token');
        localStorage.removeItem('Id');
        localStorage.removeItem('AuthId');
        localStorage.removeItem('Role');
        localStorage.removeItem('Name');
        localStorage.removeItem('Email');
        localStorage.removeItem('Phone');
        showToast(`You Logged Out Successfuly`, 'success');
        router.push('/signin');
      })
      .catch((error) => {
        showToast(`${error.message}`, 'error');
      });
  };

  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="container">
        <div className="profile">
          <div className="sidebar">
            <ul>
              <li
                onClick={() => switchSection('personalAccount')}
                className={data === 'personalAccount' ? 'active' : ''}
              >
                <div className="iconAndText">
                  <MdSettings />
                  <span>Personal account settings</span>
                </div>
                <div><MdChevronRight className="arrow" /></div>
              </li>
              <li
                onClick={() => switchSection('addChild')}
                className={data === 'addChild' ? 'active' : ''}
              >
                <div className="iconAndText">
                  <MdPersonAdd />
                  <span>Add a child</span>
                </div>
                <div><MdChevronRight className="arrow" /></div>
              </li>
              <li
                onClick={() => switchSection('children')}
                className={data === 'children' ? 'active' : ''}
              >
                <div className="iconAndText">
                  <MdPersonAdd />
                  <span>My children</span>
                </div>
                <div><MdChevronRight className="arrow" /></div>
              </li>
              <li
                onClick={() => switchSection('reminders')}
                className={data === 'reminders' ? 'active' : ''}
              >
                <div className="iconAndText">
                  <MdNotifications />
                  <span>Reminders</span>
                </div>
                <div><MdChevronRight className="arrow" /></div>
              </li>
              <li
                onClick={() => switchSection('reservation')}
                className={data === 'reservation' ? 'active' : ''}
              >
                <div className="iconAndText">
                  <MdCalendarToday />
                  <span>Reservations</span>
                </div>
                <div><MdChevronRight className="arrow" /></div>
              </li>
              <li
                onClick={() => switchSection('favorites')}
                className={data === 'favorites' ? 'active' : ''}
              >
                <div className="iconAndText">
                  <MdFavorite />
                  <span>Favorites</span>
                </div>
                <div><MdChevronRight className="arrow" /></div>
              </li>
              <li onClick={() => setShowLogoutModal(true)} className="logOut">
                <div className="iconAndText">
                  <MdLogout />
                  <span>Log Out</span>
                </div>
              </li>
            </ul>
          </div>
          {data === 'personalAccount' && <PersonalAccount />}
          {data === 'children' && <Children icon={<MdEdit />} />}
          {data === 'addChild' && <AddChild />}
          {data === 'reminders' && <Reminders />}
          {data === 'reservation' && <Reservation />}
          {data === 'favorites' && <Favorites />}
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => { setShowLogoutModal(false); handleLogOut(); }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
