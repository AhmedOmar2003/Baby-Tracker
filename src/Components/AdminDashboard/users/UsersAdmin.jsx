'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { MdPersonAdd, MdEdit, MdDelete, MdClose, MdSave, MdPerson, MdEmail, MdPhone, MdBoy, MdGirl } from 'react-icons/md';
import './usersAdmin.css';

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        // Edit
        const body = { name: form.name, email: form.email, phone: form.phone };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast('User updated successfully ✅', 'success');
      } else {
        // Add
        if (!form.password) { showToast('Password is required.', 'warning'); setLoading(false); return; }
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast('User added successfully ✅', 'success');
      }
      onSave();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ua-modal-overlay" onClick={onClose}>
      <div className="ua-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ua-modal-header">
          <h3>{user ? 'Edit User' : 'Add New User'}</h3>
          <button className="ua-close-btn" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className="ua-form">
          <div className="ua-input-group">
            <label><MdPerson /> Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Sara Ahmed" required />
          </div>
          <div className="ua-input-group">
            <label><MdEmail /> Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="user@example.com" required />
          </div>
          <div className="ua-input-group">
            <label><MdPhone /> Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+20..." />
          </div>
          <div className="ua-input-group">
            <label>🔒 {user ? 'New Password (leave empty to keep)' : 'Password'}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          <div className="ua-modal-actions">
            <button type="button" className="ua-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="ua-btn-save" disabled={loading}>
              <MdSave /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState(undefined); // undefined=closed, null=add, obj=edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [userChildren, setUserChildren] = useState({});
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) {
      showToast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildrenForUser = async (userId, appId) => {
    if (userChildren[userId] !== undefined) return;
    try {
      const res = await axios.get(`${host}/child/myChildren`, {
        headers: { 'Content-Type': 'application/json' },
        params: { user_id: appId },
      });
      const rows = res.data?.data?.rows || [];
      setUserChildren((prev) => ({ ...prev, [userId]: rows }));
    } catch {
      setUserChildren((prev) => ({ ...prev, [userId]: [] }));
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('User deleted ✅', 'success');
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = users.filter((u) =>
    (u.name + ' ' + u.email).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="users-admin">
      <div className="ua-header">
        <div>
          <h2>Regular Users Management</h2>
          <p>Manage only regular users — {users.length} total</p>
        </div>
        <div className="ua-header-actions">
          <input
            className="ua-search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ua-btn-add" onClick={() => setModalUser(null)}>
            <MdPersonAdd /> Add User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ua-loading">Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="ua-empty">No users found.</div>
      ) : (
        <div className="ua-table-wrapper">
          <table className="ua-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="ua-user-cell">
                      <div className="ua-avatar">{user.name?.charAt(0) || '?'}</div>
                      <span>{user.name || user.email}</span>
                    </div>
                  </td>
                  <td><span className="ua-email">{user.email}</span></td>
                  <td>{user.phone || '—'}</td>
                  <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                  <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <div className="ua-actions">
                      <button className="ua-action-btn edit" onClick={() => setModalUser(user)} title="Edit"><MdEdit /></button>
                      <button className="ua-action-btn delete" onClick={() => setDeleteTarget(user.id)} title="Delete"><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalUser !== undefined && (
        <UserModal
          user={modalUser}
          onClose={() => setModalUser(undefined)}
          onSave={() => { setModalUser(undefined); fetchUsers(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? All their data will be lost."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
