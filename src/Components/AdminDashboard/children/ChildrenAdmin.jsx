'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { MdBoy, MdGirl, MdDelete, MdAdd, MdClose, MdSave } from 'react-icons/md';
import './childrenAdmin.css';


function AddChildModal({ users, onClose, onSave }) {
  const [form, setForm] = useState({
    userId: users[0]?.appId || '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    date_of_birth: '',
    weight: '',
    height: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId) {
      showToast('Please choose a user first.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: form.userId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        weight: Number(form.weight),
        height: Number(form.height),
      };

      await axios.post(`${host}/child/create`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      showToast('Child added successfully ✅', 'success');
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ca-modal-overlay" onClick={onClose}>
      <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ca-modal-header">
          <h3>Add Child</h3>
          <button className="ca-close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ca-form">
          <div className="ca-input-group">
            <label>Belongs To</label>
            <select name="userId" value={form.userId} onChange={handleChange} required>
              <option value="" disabled>
                Select user
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.appId}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          </div>

          <div className="ca-form-row">
            <div className="ca-input-group">
              <label>First Name</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="First name"
                required
              />
            </div>
            <div className="ca-input-group">
              <label>Last Name</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="ca-form-row">
            <div className="ca-input-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="ca-input-group">
              <label>Date of Birth</label>
              <input
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="ca-form-row">
            <div className="ca-input-group">
              <label>Weight (kg)</label>
              <input
                name="weight"
                type="number"
                value={form.weight}
                onChange={handleChange}
                placeholder="e.g. 12"
                step="0.1"
                required
              />
            </div>
            <div className="ca-input-group">
              <label>Height (cm)</label>
              <input
                name="height"
                type="number"
                value={form.height}
                onChange={handleChange}
                placeholder="e.g. 80"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="ca-modal-actions">
            <button type="button" className="ca-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ca-btn-save" disabled={loading}>
              <MdSave /> {loading ? 'Adding...' : 'Add Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChildrenAdmin() {
  const [users, setUsers] = useState([]);
  const [children, setChildren] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch {
      showToast('Failed to load users.', 'error');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchChildren = async (regularUsers) => {
    setLoadingChildren(true);
    try {
      const results = await Promise.all(
        regularUsers.map(async (user) => {
          try {
            const res = await axios.get(`${host}/child/myChildren`, {
              headers: { 'Content-Type': 'application/json' },
              params: { user_id: user.appId },
            });
            const rows = res.data?.data?.rows || [];
            return rows.map((child) => ({
              ...child,
              parentId: user.id,
              parentAppId: user.appId,
              parentName: user.name,
              parentEmail: user.email,
            }));
          } catch {
            return [];
          }
        })
      );

      setChildren(results.flat());
    } catch {
      setChildren([]);
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchChildren(users);
  }, [users]);

  const handleDeleteChild = async () => {
    try {
      await axios.delete(`${host}/child/childById/${deleteTarget}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      showToast('Child deleted ✅', 'success');
      fetchChildren(users);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = children.filter((child) => {
    const text = [
      child.first_name,
      child.last_name,
      child.parentName,
      child.parentEmail,
    ]
      .join(' ')
      .toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const isLoading = loadingUsers || loadingChildren;

  return (
    <div className="children-admin">
      <div className="ca-header">
        <div>
          <h2>Children Management</h2>
          <p>Each row shows a child and the regular user account it belongs to.</p>
        </div>
        <div className="ca-header-actions">
          <input
            className="ca-search"
            placeholder="Search child or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ca-add-child-btn" onClick={() => setShowAddModal(true)}>
            <MdAdd /> Add Child
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="ca-loading">Loading children...</div>
      ) : filtered.length === 0 ? (
        <div className="ca-empty">No children found.</div>
      ) : (
        <div className="ca-table-wrapper">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Parent User</th>
                <th>Parent Email</th>
                <th>Gender</th>
                <th>DOB</th>
                <th>Weight</th>
                <th>Height</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((child) => (
                <tr key={child.child_id}>
                  <td>
                    <div className="ca-child-cell">
                      <div className="ca-child-icon">
                        {child.gender === 'Female' ? (
                          <MdGirl className="ca-icon female" />
                        ) : (
                          <MdBoy className="ca-icon male" />
                        )}
                      </div>
                      <div>
                        <strong>{child.first_name} {child.last_name}</strong>
                        <span>{child.child_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{child.parentName}</td>
                  <td>{child.parentEmail}</td>
                  <td>{child.gender}</td>
                  <td>{child.date_of_birth?.slice(0, 10) || '—'}</td>
                  <td>{child.weight ?? '—'}</td>
                  <td>{child.height ?? '—'}</td>
                  <td>
                    <button
                      className="ca-delete-child"
                      onClick={() => setDeleteTarget(child.child_id)}
                      title="Delete child"
                    >
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddChildModal
          users={users}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            fetchChildren(users);
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Child"
        message="Are you sure you want to permanently delete this child?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteChild}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
