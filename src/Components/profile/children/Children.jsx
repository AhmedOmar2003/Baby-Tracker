import { useEffect, useState } from 'react';
import './children.css';
import axios from 'axios';
import Link from 'next/link';
import { MdDelete, MdBoy, MdGirl, MdChildCare } from 'react-icons/md';
import { host } from '@/Components/utils/Host';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { showToast } from '@/Components/Toast/Toast';
import { normalizeStoredUserIds } from '@/lib/userIdentity';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';

export default function Children(props) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [childToDelete, setChildToDelete] = useState(null);

  function getChildren() {
    const { appUserId } = normalizeStoredUserIds();
    const userId = appUserId || localStorage.getItem('Id');
    axios
      .get(`${host}/child/myChildren`, {
        headers: { 'Content-Type': 'application/json' },
        params: { user_id: userId },
      })
      .then((response) => {
        const children = response?.data?.data?.rows;
        setData(Array.isArray(children) ? children : []);
      })
      .catch((error) => {
        setData([]);
        // 500 usually means "no children yet" — don't alarm the user
        if (error.response?.status !== 500) {
          showToast(`Connection error: ${error.message}`, 'error');
        }
      });
  }

  const handleDelete = (id) => {
    axios
      .delete(`${host}/child/childById/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      })
      .then((response) => {
        showToast('Child deleted successfully ✅', 'success');
        getChildren();
        setShowDeleteModal(false);
        setChildToDelete(null);
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
    getChildren();
  }, []);

  const filteredData = data.filter((item) => {
    const childName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
    const matchesSearch = childName.includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || item.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div>
      <div className="container">
        <div className="children">
          <PageTitle text="My children" />
          
          {data.length > 0 && (
            <div className="filters-container">
              <input
                type="text"
                placeholder="Search by child's name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="gender-select"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          )}

          {data.length === 0 && (
            <div className="children-empty">
              <MdChildCare className="children-empty-icon" />
              <h4>No children added yet</h4>
              <p>Add your child&apos;s profile to track vaccines, doses, and appointments.</p>
              <Link href="/profile?section=addChild" className="children-empty-btn">
                Add a Child
              </Link>
            </div>
          )}

          <div className="divContent">
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
              return (
                <div
                  className="contentInformation"
                  key={item.child_id}
                >
                  {/* Top: Avatar + Info */}
                  <Link href={`/profile/${item.child_id}`}>
                    <div className="content">
                      <div className="infoAndImage">
                        <div className="child-avatar-icon">
                          {item.gender === 'Female' ? (
                            <MdGirl className="avatar-icon female-icon" />
                          ) : (
                            <MdBoy className="avatar-icon male-icon" />
                          )}
                        </div>
                        <div className="info">
                          <h5>{`${item.first_name} ${item.last_name}`}</h5>
                          <p>{item.date_of_birth}</p>
                          <span className={`gender-badge ${item.gender === 'Female' ? 'female' : 'male'}`}>
                            {item.gender}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Bottom: Action Buttons row */}
                  <div className="card-actions">
                    <Link href={`/profile/${item.child_id}`} className="action-btn primary-btn">
                      Details
                    </Link>
                    <Link href={`/profile/childDosesByChildId/${item.child_id}`} className="action-btn secondary-btn">
                      View Doses
                    </Link>
                    <Link href={`/profile/${item.child_id}/editForm/${item.child_id}`} className="action-btn icon-btn edit-btn" title="Edit">
                      {props.icon}
                    </Link>
                    <button
                      className="action-btn icon-btn delete-btn"
                      title="Delete"
                      onClick={() => {
                        setChildToDelete(item.child_id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
              );
            })
            ) : data.length > 0 ? (
              <p className="no-results">No children found matching your search.</p>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Child"
        message="Are you sure you want to permanently delete this child's profile? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          if (childToDelete) {
            handleDelete(childToDelete);
          }
        }}
        onCancel={() => {
          setShowDeleteModal(false);
          setChildToDelete(null);
        }}
      />
    </div>
  );
}
