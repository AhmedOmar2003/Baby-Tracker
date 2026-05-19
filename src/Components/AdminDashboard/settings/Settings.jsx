'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/Components/Toast/Toast';
import { MdOutlineSecurity, MdOutlineInfo } from 'react-icons/md';
import './settings.css';

export default function Settings() {
  const [adminEmail, setAdminEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setAdminEmail(data.user.email || '');
      }
    };
    fetchAdminInfo();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      showToast(`Error: ${error.message}`, 'error');
    } else {
      showToast('Password updated successfully. ✅', 'success');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="admin-settings-page">
      <div className="settings-header">
        <h2>Admin Settings</h2>
        <p>Manage site configuration and your admin account security.</p>
      </div>

      <div className="settings-content">
        {/* Site Overview Section */}
        <section className="settings-card">
          <div className="card-header">
            <MdOutlineInfo className="header-icon" />
            <h3>Site Overview</h3>
          </div>
          <div className="card-body">
            <div className="info-group">
              <label>System Name</label>
              <p>Baby Tracker Platform</p>
            </div>
            <div className="info-group">
              <label>System Version</label>
              <p>v1.0.0 (Production)</p>
            </div>
            <div className="info-group">
              <label>Admin Email</label>
              <p className="highlight">{adminEmail || 'Loading...'}</p>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="settings-card">
          <div className="card-header">
            <MdOutlineSecurity className="header-icon" />
            <h3>Security & Password</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="save-btn">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
