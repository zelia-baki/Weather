import React, { useState, useEffect, useRef } from 'react';
import {
  PenSquare, Trash2, Edit3, Eye, X, CheckCircle,
  AlertTriangle, RefreshCw, BookOpen, Plus, Image, Upload
} from 'lucide-react';
import axiosInstance from '../../axiosInstance';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = d =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const calcRead = body => {
  const words = (body || '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200)) + ' min';
};

const EMPTY_FORM = { title: '', excerpt: '', author: '', category: '', tags: '', body: '' };

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error:   'bg-red-50 border-red-200 text-red-700',
  };
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${styles[type]}`}>
      <Icon className="w-4 h-4" />{msg}
    </div>
  );
};

// ─── Preview modal ────────────────────────────────────────────────────────────
const PreviewModal = ({ form, coverPreview, onClose }) => {
  const renderBody = (text = '') =>
    text.trim().split('\n').map((line, i) => {
      if (line.startsWith('## '))
        return <h2 key={i} className="text-lg font-semibold text-gray-900 mt-6 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('- '))
        return (
          <div key={i} className="flex gap-2 items-start mb-1.5">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
            <span className="text-gray-700 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        );
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <p key={i} className="text-gray-700 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
    });

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <span className="font-semibold text-gray-900">Preview</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          {coverPreview && (
            <div className="rounded-2xl overflow-hidden mb-5" style={{ height: 200 }}>
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            </div>
          )}
          {form.category && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4 ${
              form.category === 'Field Story' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.category === 'Field Story' ? 'bg-emerald-500' : 'bg-purple-500'}`} />
              {form.category}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
            {form.title || <span className="text-gray-300">No title yet</span>}
          </h1>
          {form.excerpt && (
            <p className="text-base text-gray-500 italic border-l-4 border-purple-200 pl-4 mb-6">{form.excerpt}</p>
          )}
          <div className="border-t border-gray-100 mb-6" />
          <div>{renderBody(form.body)}</div>
          {form.tags && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
              {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CoverUpload ──────────────────────────────────────────────────────────────
const CoverUpload = ({ coverPreview, onFileChange, onRemove }) => {
  const inputRef = useRef(null);

  const handleDrop = e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileChange(file);
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        Cover image <span className="text-gray-300 font-normal">(optional — jpg, png, webp)</span>
      </label>

      {coverPreview ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-purple-200" style={{ height: 160 }}>
          <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
            <button type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-white/90 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow hover:bg-white transition-colors">
              <Upload className="w-3.5 h-3.5" /> Change
            </button>
            <button type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 bg-red-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow hover:bg-red-500 transition-colors">
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-purple-400 rounded-2xl cursor-pointer transition-colors bg-gray-50 hover:bg-purple-50"
          style={{ height: 120 }}>
          <Image className="w-8 h-8 text-gray-300" />
          <p className="text-xs text-gray-400">Click or drag & drop an image</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={e => {
          const file = e.target.files[0];
          if (file) onFileChange(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

// ─── Main BlogAdmin ───────────────────────────────────────────────────────────
const BlogAdmin = () => {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState(null);   // string (slug) ou null
  const [preview, setPreview]       = useState(false);
  const [toast, setToast]           = useState({ msg: '', type: 'success' });

  const [coverFile, setCoverFile]       = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [removeCover, setRemoveCover]   = useState(false);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/blog/posts/');
      setPosts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      notify('Failed to load posts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleCoverFile = file => {
    if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
  };

  const handleRemoveCover = () => {
    if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview('');
    setRemoveCover(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.excerpt || !form.author || !form.category || !form.body) {
      notify('Please fill in all required fields.', 'error');
      return;
    }
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append('title',    form.title.trim());
      fd.append('excerpt',  form.excerpt.trim());
      fd.append('author',   form.author.trim());
      fd.append('category', form.category);
      fd.append('body',     form.body.trim());

      const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      fd.append('tags', JSON.stringify(tagsArr));

      if (coverFile) fd.append('cover_image', coverFile);
      if (removeCover) fd.append('remove_cover', 'true');

      if (editId) {
        // ✅ PATCH /api/blog/posts/<post_id>/ (le id est le slug dans Doc 2)
        await axiosInstance.patch(`/api/blog/posts/${editId}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        notify('Article updated!');
      } else {
        await axiosInstance.post('/api/blog/posts/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        notify('Article published!');
      }

      resetForm();
      await fetchPosts();
    } catch {
      notify('Failed to save article.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview('');
    setRemoveCover(false);
  };

  const handleEdit = async post => {
    // ✅ CORRIGÉ : charge le body via GET /api/blog/posts/<post_id>/
    // Dans Doc 2, ce endpoint retourne { ...meta, body }
    setEditId(post.id);
    setForm({
      title:    post.title || '',
      excerpt:  post.excerpt || '',
      author:   post.author || '',
      category: post.category || '',
      tags:     (post.tags || []).join(', '),
      body:     '',
    });

    try {
      const res = await axiosInstance.get(`/api/blog/posts/${post.id}/`);
      setForm(f => ({ ...f, body: res.data.body || '' }));
    } catch {
      notify('Failed to load article content.', 'error');
    }

    if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    // ✅ La cover_image du Doc 2 est déjà une URL relative /api/blog/covers/<filename>
    // Le backend la sert directement, pas besoin de préfixe localhost
    setCoverPreview(post.cover_image || '');
    setRemoveCover(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this article?')) return;
    try {
      await axiosInstance.delete(`/api/blog/posts/${id}/`);
      notify('Article deleted.');
      await fetchPosts();
      if (editId === id) resetForm();
    } catch {
      notify('Failed to delete.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <PenSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Admin</h1>
              <p className="text-sm text-gray-400">Write and manage field articles</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-gray-400">{posts.length} article{posts.length !== 1 ? 's' : ''} published</span>
              <button onClick={fetchPosts}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── FORM (left) ── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {editId
                    ? <><Edit3 className="w-5 h-5 text-purple-500" /> Edit article</>
                    : <><Plus className="w-5 h-5 text-purple-500" /> New article</>}
                </h2>
                {editId && (
                  <button onClick={resetForm}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Cancel edit
                  </button>
                )}
              </div>

              <CoverUpload
                coverPreview={coverPreview}
                onFileChange={handleCoverFile}
                onRemove={handleRemoveCover}
              />

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Article title"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm text-gray-900 transition-colors" />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Excerpt * <span className="text-gray-300 font-normal">(shown on the card)</span></label>
                <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                  rows={2} placeholder="One or two sentences summarising the article..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm text-gray-900 transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Author *</label>
                  <input type="text" value={form.author} onChange={e => set('author', e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm text-gray-900 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm text-gray-900 bg-white transition-colors">
                    <option value="">— select —</option>
                    <option value="Field Story">Field Story</option>
                    <option value="Article">Article</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tags <span className="text-gray-300 font-normal">(comma-separated)</span></label>
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="irrigation, drought, maize"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm text-gray-900 transition-colors" />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Content * <span className="text-gray-300 font-normal">— use ## for headings, - for bullets, **bold**</span>
                </label>
                <textarea value={form.body} onChange={e => set('body', e.target.value)}
                  rows={14} placeholder={"Write your article here...\n\n## Section heading\n\nYour paragraph text.\n\n- A bullet point\n- Another point"}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm text-gray-900 font-mono leading-relaxed transition-colors resize-none" />
                {form.body && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    ~{calcRead(form.body)} read · {form.body.split(/\s+/).length} words
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSubmit} disabled={saving}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm shadow-md hover:opacity-90 transition-opacity disabled:opacity-60">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  {saving ? 'Saving…' : editId ? 'Update article' : 'Publish article'}
                </button>
                <button onClick={() => setPreview(true)}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
                  <Eye className="w-4 h-4" /> Preview
                </button>
                {editId && (
                  <button onClick={resetForm}
                    className="ml-auto text-sm text-gray-400 hover:text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── PUBLISHED LIST (right) ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-6 sticky top-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                Published
                <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full ml-1">{posts.length}</span>
              </h2>

              {loading ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No articles yet.</div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {[...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map(p => (
                      <div key={p.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          editId === p.id
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}>
                        {p.cover_image && (
                          <div className="rounded-xl overflow-hidden mb-2" style={{ height: 80 }}>
                            <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            p.category === 'Field Story' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {p.category}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{fmtDate(p.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 leading-snug mb-2 line-clamp-2">{p.title}</p>
                        <p className="text-xs text-gray-400 mb-3">by {p.author}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(p)}
                            className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 bg-white border border-purple-200 px-3 py-1.5 rounded-lg transition-colors font-medium">
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg transition-colors font-medium">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {preview && <PreviewModal form={form} coverPreview={coverPreview} onClose={() => setPreview(false)} />}
      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
};

export default BlogAdmin;