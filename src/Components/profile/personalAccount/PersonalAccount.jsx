'use client';
import './personalAccount.css';
import { MdPerson, MdEmail, MdPhone, MdLock } from 'react-icons/md';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { showToast } from '@/Components/Toast/Toast';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { normalizeStoredUserIds } from '@/lib/userIdentity';

export default function PersonalAccount() {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone_number, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initialdata, setInitialData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const errorShown = React.useRef(false); // prevent double toast in StrictMode
  const router = useRouter();

  function getDataById() {
    const { authId } = normalizeStoredUserIds();
    const Id = authId || localStorage.getItem('AuthId');
    let token = localStorage.getItem('Token');
    if (!token) {
      showToast('You Are Not Logged In', 'warning');
      router.push('/signin');
      return;
    }

    // Load from localStorage as instant fallback
    const savedName = localStorage.getItem('Name') || '';
    const parts = savedName.trim().split(' ');
    const fName = parts[0] || '';
    const lName = parts[1] ? parts.slice(1).join(' ') : '';
    const savedEmail = localStorage.getItem('Email') || '';
    const savedPhone = localStorage.getItem('Phone') || '';
    if (fName) setFirstName(fName);
    if (lName) setLastName(lName);
    if (savedEmail) setEmail(savedEmail);
    if (savedPhone) setPhone(savedPhone);
    setInitialData({
      first_name: fName,
      last_name: lName,
      email: savedEmail,
      phone_number: savedPhone,
    });

    axios
      .get(`${host}/user/userById/${Id}`, {
        headers: { 'Content-Type': 'application/json' },
      })
      .then((response) => {
        const user = response.data.data.rows[0];
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setEmail(user.email || '');
        setPhone(user.phone_number || '');
        setInitialData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
        });
      })
      .catch((error) => {
        if (!errorShown.current) {
          errorShown.current = true;
          showToast(
            error.response?.data?.msg ||
              'Could not load profile from server. Please try again later.',
            'error'
          );
        }
      });
  }

  const handleEdit = (e) => {
    e.preventDefault();
    const { authId } = normalizeStoredUserIds();
    const Id = authId || localStorage.getItem('AuthId');
    const changeData =
      first_name !== initialdata.first_name ||
      last_name !== initialdata.last_name ||
      phone_number !== initialdata.phone_number ||
      password !== '';

    if (!changeData) {
      showToast(`You didn't change anything`, 'warning');
      return;
    }

    const paramsEdit = {
      first_name,
      last_name,
      phone_number,
    };

    if (password) {
      paramsEdit.password = password;
    }

    axios
      .put(`${host}/user/update/${Id}`, paramsEdit, {
        headers: { 'Content-Type': 'application/json' },
      })
      .then(() => {
        showToast(`Updated Your Account Successfully`, 'success');
        setPassword('');
        setInitialData({ ...initialdata, first_name, last_name, phone_number });
        setIsEditing(false);
      })
      .catch((error) => {
        showToast(
          error.response?.data?.msg ||
            error.response?.data?.message ||
            error.message,
          'error'
        );
      });
  };

  const deleteAccount = () => {
    const Id = localStorage.getItem('AuthId') || localStorage.getItem('Id') || initialdata.id;
    localStorage.removeItem('Token');
    localStorage.removeItem('Id');
    localStorage.removeItem('AuthId');
    localStorage.removeItem('Role');
    localStorage.removeItem('Name');
    axios
      .delete(`${host}/user/userById/${Id}`, {
        headers: { 'Content-Type': 'application/json' },
      })
      .then(() => {
        showToast(`Your account has been permanently deleted.`, 'success');
        router.push('/signup');
      })
      .catch((error) => {
        showToast(
          error.response?.data?.msg ||
            error.response?.data?.message ||
            error.message,
          'error'
        );
      });
  };

  useEffect(() => {
    getDataById();
  }, []);

  const hasChanged =
    first_name !== initialdata.first_name ||
    last_name !== initialdata.last_name ||
    phone_number !== initialdata.phone_number ||
    password !== '';

  return (
    <div className="personalAccount">
      <PageTitle text="Personal account settings" />
      <form>
        <div className="field-group">
          <label>First Name</label>
          <div className="input-wrapper">
            <MdPerson className="field-icon" />
            <input
              type="text"
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
              readOnly={!isEditing}
              className={!isEditing ? "readonly-input" : ""}
            />
          </div>
        </div>

        <div className="field-group">
          <label>Last Name</label>
          <div className="input-wrapper">
            <MdPerson className="field-icon" />
            <input
              type="text"
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
              readOnly={!isEditing}
              className={!isEditing ? "readonly-input" : ""}
            />
          </div>
        </div>

        <div className="field-group">
          <label>Phone Number</label>
          <div className="input-wrapper">
            <MdPhone className="field-icon" />
            <input
              type="text"
              value={phone_number}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              required
              readOnly={!isEditing}
              className={!isEditing ? "readonly-input" : ""}
            />
          </div>
        </div>

        {isEditing && (
          <div className="field-group">
            <label>New Password <span className="optional">(leave empty to keep current)</span></label>
            <div className="input-wrapper">
              <MdLock className="field-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
        )}

        <div className="field-group">
          <label>Email <span className="locked-badge">Locked</span></label>
          <div className="input-wrapper">
            <MdEmail className="field-icon" />
            <input
              type="email"
              value={email}
              readOnly
              className="readonly-input"
              tabIndex={-1}
            />
          </div>
        </div>

        <div className="buttons">
          {!isEditing ? (
            <button type="button" onClick={() => setIsEditing(true)}>
              Edit Data
            </button>
          ) : (
            <>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setFirstName(initialdata.first_name);
                  setLastName(initialdata.last_name);
                  setPhone(initialdata.phone_number);
                  setPassword('');
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
              {hasChanged && (
                <button id="edit" type="submit" onClick={handleEdit}>
                  Save Changes
                </button>
              )}
            </>
          )}
        </div>

        <div className="danger-zone">
          <button
            type="button"
            className="delete-link"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          setShowDeleteModal(false);
          deleteAccount();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
