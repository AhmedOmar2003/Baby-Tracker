'use client';
import { useEffect, useState } from 'react';
import '@/Components/AdminDashboard/adminSection.css';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import ConfirmModal from '@/Components/ConfirmModal/ConfirmModal';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { addAdminNotification } from '@/hooks/useAdminNotifications';

const ARTICLE_CATEGORIES = ['Baby Care', 'Nutrition', 'Vaccines', 'Health Tips', 'Milestones', 'Parenting', 'Sleep', 'Safety', 'Mental Health', 'General'];
const EMPTY = { title: '', content: '', author: '', publicationDate: '', tags: '', category: '', status: 'published', views: '0', references: '', isFeatured: 'false' };
function EditArticleModal({ articleId, articles, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const article = articles.find(a => a._id === articleId);
    if (article) {
      setForm({
        title: article.title || '',
        content: article.content || '',
        author: article.author || '',
        publicationDate: article.publicationDate ? new Date(article.publicationDate).toISOString().split('T')[0] : '',
        tags: article.tags ? article.tags.join(', ') : '',
        category: article.category || '',
        status: article.status || 'published',
        views: String(article.views || 0),
        references: article.references ? article.references.join(', ') : '',
        isFeatured: String(article.isFeatured || false),
      });
    }
  }, [articleId, articles]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        author: form.author,
        publicationDate: new Date(form.publicationDate).toISOString().split('T')[0],
        tags: parseArr(form.tags),
        category: form.category,
        status: form.status,
        views: Number(form.views) || 0,
        references: parseArr(form.references),
        isFeatured: form.isFeatured === 'true',
      };
      await axios.put(`${host}/article/update/${articleId}`, payload, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      showToast('Article updated successfully ✅', 'success');
      addAdminNotification({ title: 'Article Updated', message: `"${form.title}" was updated.`, type: 'edit', section: 'articles' });
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, width: '90%', maxWidth: 640, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '1.25rem', color: 'var(--section-head-color)' }}>Edit Article</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="af-field"><label>Title</label><input name="title" value={form.title} onChange={handleChange} required /></div>
            <div className="af-field"><label>Author</label><input name="author" value={form.author} onChange={handleChange} required /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="af-field"><label>Category</label><select name="category" value={form.category} onChange={handleChange} required>{ARTICLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="af-field"><label>Date</label><input name="publicationDate" type="date" value={form.publicationDate} onChange={handleChange} required /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div className="af-field"><label>Status</label><select name="status" value={form.status} onChange={handleChange}><option value="published">Published</option><option value="draft">Draft</option></select></div>
             <div className="af-field"><label>Is Featured</label><select name="isFeatured" value={form.isFeatured} onChange={handleChange}><option value="false">No</option><option value="true">Yes</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div className="af-field"><label>Tags</label><input name="tags" value={form.tags} onChange={handleChange} required /></div>
             <div className="af-field"><label>References</label><input name="references" value={form.references} onChange={handleChange} /></div>
          </div>
          <div className="af-field"><label>Content</label><textarea name="content" value={form.content} onChange={handleChange} required rows={4} /></div>
          
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#555', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'var(--gradient-primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ArticlesDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  function getData() {
    setLoading(true);
    axios.get(`${host}/article/getAll`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then((res) => setData(res.data.data.rows))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { getData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { title, content, author, publicationDate, tags, category, status, views, references, isFeatured } = form;
    if (!title || !content || !author || !publicationDate || !tags || !category) {
      showToast('Please fill all required fields.', 'warning'); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${host}/article/create`, {
        title, content,
        author: author,
        publicationDate: new Date(publicationDate).toISOString().split('T')[0],
        tags: parseArr(tags),
        category, status,
        views: Number(views) || 0,
        references: parseArr(references),
        isFeatured: isFeatured === 'true',
      }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      showToast('Article added successfully ✅', 'success');
      addAdminNotification({ title: 'Article Published', message: `"${form.title}" was added to the ${form.category} category.`, type: 'add', section: 'articles' });
      setForm(EMPTY); setShowForm(false); getData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = () => {
    axios.delete(`${host}/article/articleById/${deleteTarget}`, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
      .then(() => { showToast('Article deleted ✅', 'success'); addAdminNotification({ title: 'Article Deleted', message: 'An article was removed from the database.', type: 'delete', section: 'articles' }); getData(); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setDeleteTarget(null));
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Articles</h2>
          <p>{data.length} article{data.length !== 1 ? 's' : ''} published</p>
        </div>
        <button className={`btn-toggle-form ${showForm ? 'open' : ''}`} onClick={() => setShowForm(!showForm)}>
          <MdAdd /> {showForm ? 'Cancel' : 'New Article'}
        </button>
      </div>

      <div className={`admin-form-panel ${showForm ? 'open' : ''}`}>
        <div className="admin-form-card">
          <form onSubmit={handleAdd}>
            <div className="admin-form-grid">
              <div className="af-field">
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Article title" />
              </div>
              <div className="af-field">
                <label>Author *</label>
                <input name="author" value={form.author} onChange={handleChange} placeholder="e.g. Dr. Sara Ahmed" />
              </div>
              <div className="af-field">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select category…</option>
                  {ARTICLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="af-field">
                <label>Publication Date *</label>
                <input name="publicationDate" type="date" value={form.publicationDate} onChange={handleChange} />
              </div>
              <div className="af-field">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="af-field">
                <label>Is Featured</label>
                <select name="isFeatured" value={form.isFeatured} onChange={handleChange}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="af-field">
                <label>Tags * (comma-separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} placeholder="Health, Baby, Care" />
              </div>
              <div className="af-field">
                <label>References (comma-separated)</label>
                <input name="references" value={form.references} onChange={handleChange} placeholder="https://who.int, ..." />
              </div>
              <div className="af-field span2">
                <label>Content *</label>
                <textarea name="content" value={form.content} onChange={handleChange} placeholder="Write the article content here…" rows={4} />
              </div>
            </div>
            <div className="af-actions">
              <button type="button" className="af-btn-cancel" onClick={() => { setShowForm(false); setForm(EMPTY); }}>Cancel</button>
              <button type="submit" className="af-btn-submit" disabled={submitting}>
                <MdEdit /> {submitting ? 'Saving…' : 'Add Article'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading articles…</div>
      ) : data.length === 0 ? (
        <div className="admin-empty">No articles yet. Add your first article above.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item._id}>
                  <td><span style={{ fontWeight: 700 }}>{item.title}</span></td>
                  <td>{item.author}</td>
                  <td><span className="badge badge-info">{item.category}</span></td>
                  <td>
                    <span className={`badge ${item.status === 'published' ? 'badge-success' : 'badge-warn'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#888' }}>{item.publicationDate?.slice(0,10)}</td>
                  <td>
                    <div className="tbl-actions">
                      <button className="tbl-btn edit" onClick={() => setEditTarget(item._id)} title="Edit"><MdEdit /></button>
                      <button className="tbl-btn delete" onClick={() => setDeleteTarget(item._id)} title="Delete"><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Article"
        message="Are you sure you want to permanently delete this article?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditArticleModal
          articleId={editTarget}
          articles={data}
          onClose={() => setEditTarget(null)}
          onSave={() => { setEditTarget(null); getData(); }}
        />
      )}
    </div>
  );
}
