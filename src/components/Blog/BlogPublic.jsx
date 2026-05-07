import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Calendar, User, Clock, Tag,
         ChevronRight, ArrowLeft, Share2, Leaf } from 'lucide-react';
import axiosInstance from '../../axiosInstance';

const fmtDate = (d, long) =>
  new Date(d).toLocaleDateString('en-US',
    long ? { month: 'long', day: 'numeric', year: 'numeric' }
         : { month: 'short', day: 'numeric', year: 'numeric' });

const catStyle = {
  'Field Story': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Article':     { bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
};

// ── SVG de fallback (inchangé) ────────────────────────────────────────────────
const CoverSVG = ({ category, tall = false }) => {
  const h = tall ? 320 : 180;
  if (category === 'Field Story')
    return (
      <svg viewBox={`0 0 800 ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="cov-fs" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d1fae5" /><stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient></defs>
        <rect width="800" height={h} fill="url(#cov-fs)" />
        {[...Array(9)].map((_, i) => (
          <ellipse key={i} cx={50 + i * 85} cy={h - 45 - (i % 3) * 22} rx={22} ry={46}
            fill="#34d399" opacity={0.38 + (i % 3) * 0.15} />
        ))}
      </svg>
    );
  return (
    <svg viewBox={`0 0 800 ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cov-art" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ede9fe" /><stop offset="100%" stopColor="#c4b5fd" />
      </linearGradient></defs>
      <rect width="800" height={h} fill="url(#cov-art)" />
      {[...Array(5)].map((_, i) => (
        <circle key={i} cx={80 + i * 160} cy={h / 2} r={30 + i * 18}
          fill="#8b5cf6" opacity={0.1 + i * 0.05} />
      ))}
    </svg>
  );
};

// ── Cover : vraie photo si disponible, SVG sinon ──────────────────────────────
const Cover = ({ post, tall = false }) => {
  const h = tall ? 260 : undefined; // undefined → height géré par le parent

  if (post.cover_image) {
    return (
      <img
        src={post.cover_image}
        alt={post.title}
        className="w-full h-full object-cover"
        style={h ? { height: h } : undefined}
      />
    );
  }
  return <CoverSVG category={post.category} tall={tall} />;
};

const renderBody = (text = '') =>
  text.trim().split('\n').map((line, i) => {
    if (line.startsWith('## '))
      return <h2 key={i} className="text-xl font-semibold text-gray-900 mt-8 mb-3">{line.slice(3)}</h2>;
    if (line.startsWith('- '))
      return (
        <div key={i} className="flex gap-3 items-start mb-2">
          <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
          <span className="text-gray-700 text-[15px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      );
    if (!line.trim()) return <div key={i} className="h-3" />;
    return <p key={i} className="text-gray-700 text-[15px] leading-relaxed mb-1"
      dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
  });

const Badge = ({ category }) => {
  const s = catStyle[category] || catStyle['Article'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{category}
    </span>
  );
};

// ─── Post detail ──────────────────────────────────────────────────────────────
const PostDetail = ({ post, onBack }) => {
  const [body, setBody]               = useState('');
  const [loadingBody, setLoadingBody] = useState(true);

  useEffect(() => {
    axiosInstance.get(`/api/blog/posts/${post.slug}/content/`)
      .then(res => setBody(res.data.body || ''))
      .catch(() => setBody(''))
      .finally(() => setLoadingBody(false));
  }, [post.slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 bg-white text-gray-600 hover:text-purple-700 px-5 py-2.5 rounded-xl shadow-sm border border-purple-100 font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </button>

        <div className="bg-white rounded-3xl shadow-lg border border-purple-100 overflow-hidden">
          {/* ── Cover (photo ou SVG) ── */}
          <div className="overflow-hidden" style={{ height: 260 }}>
            <Cover post={post} tall />
          </div>

          <div className="p-8 md:p-10">
            <div className="flex items-center flex-wrap gap-3 mb-5">
              <Badge category={post.category} />
              <div className="flex items-center gap-4 text-xs text-gray-400 ml-auto flex-wrap">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{post.author}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{fmtDate(post.created_at, true)}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{post.read_time || '5 min'} read</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{post.title}</h1>
            <p className="text-lg text-gray-500 leading-relaxed border-l-4 border-purple-200 pl-5 mb-8 italic">{post.excerpt}</p>
            <div className="border-t border-gray-100 mb-8" />

            {loadingBody
              ? <p className="text-gray-400 text-sm animate-pulse">Loading content…</p>
              : <div>{renderBody(body)}</div>
            }

            <div className="border-t border-gray-100 mt-10 pt-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap gap-2">
                {(post.tags || []).map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                    <Tag className="w-3 h-3" />{t}
                  </span>
                ))}
              </div>
              <button className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {post.author?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{post.author}</p>
            <p className="text-xs text-gray-400 mt-0.5">Field contributor</p>
          </div>
          <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Author
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main BlogPublic ──────────────────────────────────────────────────────────
const BlogPublic = () => {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axiosInstance.get('/api/blog/posts/')
      .then(res => setPosts(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (selected) return <PostDetail post={selected} onBack={() => setSelected(null)} />;

  const filtered = posts
    .filter(p => category === 'All' || p.category === category)
    .filter(p => {
      const q = search.toLowerCase();
      return !q || p.title?.toLowerCase().includes(q)
        || p.excerpt?.toLowerCase().includes(q)
        || (p.tags || []).some(t => t.toLowerCase().includes(q));
    });

  const featured = filtered[0];
  const rest     = filtered.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Field Blog</h1>
                <p className="text-sm text-gray-400">Stories & insights from the ground</p>
              </div>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search articles…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm text-gray-700 bg-gray-50 focus:bg-white transition-colors" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            {['All', 'Field Story', 'Article'].map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === c
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{c}</button>
            ))}
            <span className="ml-auto text-xs text-gray-400">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-16 text-center border border-purple-100">
            <p className="text-gray-400">Loading articles…</p>
          </div>
        )}

        {!loading && featured && (
          <div onClick={() => setSelected(featured)}
            className="group cursor-pointer bg-white rounded-3xl shadow-lg border border-purple-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="h-56 overflow-hidden relative">
              <Cover post={featured} />
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-bold text-purple-700 px-3 py-1.5 rounded-full shadow-sm">
                ✦ Latest
              </span>
            </div>
            <div className="p-8">
              <Badge category={featured.category} />
              <h2 className="text-2xl font-bold text-gray-900 mt-3 mb-2 leading-tight group-hover:text-purple-700 transition-colors">{featured.title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">{featured.excerpt}</p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-5 flex-wrap gap-3">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{featured.author}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{fmtDate(featured.created_at)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featured.read_time || '5 min'}</span>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-purple-600 group-hover:gap-2 transition-all">Read →</span>
              </div>
            </div>
          </div>
        )}

        {!loading && rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(p => (
              <div key={p.id} onClick={() => setSelected(p)}
                className="group cursor-pointer bg-white rounded-2xl shadow-md border border-purple-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <div className="h-40 overflow-hidden flex-shrink-0">
                  <Cover post={p} />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <Badge category={p.category} />
                  <h3 className="text-sm font-bold text-gray-900 mt-2 mb-2 leading-snug group-hover:text-purple-700 transition-colors flex-1">{p.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{p.excerpt}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(p.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">#{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{p.author?.split(' ')[0]}</span>
                      <span>{p.read_time || '5 min'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-purple-100 p-16 text-center">
            <Leaf className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No articles found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPublic;