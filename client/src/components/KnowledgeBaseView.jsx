import React, { useState, useEffect } from 'react';
import { BookOpen, Search, CheckCircle2, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

export default function KnowledgeBaseView() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const fetchArticles = async () => {
    try {
      let url = '/api/kb';
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (search) params.append('search', search);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error('Error fetching KB articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, search]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="kb-view-container">
      <div className="kb-header">
        <div>
          <h2 className="page-heading">Verified IT Knowledge Base & Runbooks</h2>
          <p className="page-subheading">
            Curated standard operating procedures (SOPs) and terminal playbooks verified by Tier 3 engineering.
          </p>
        </div>

        <div className="kb-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search runbooks by keyword, command, or symptom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="kb-cat-tabs">
        {['all', 'network', 'hardware', 'software', 'access'].map(cat => (
          <button
            key={cat}
            className={`kb-cat-tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'All Runbooks' : cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="kb-articles-grid">
        {loading ? (
          <div className="card loading-card">Loading knowledge base articles...</div>
        ) : articles.length === 0 ? (
          <div className="card empty-state">No runbooks found matching "{search}".</div>
        ) : (
          articles.map(art => (
            <div key={art.id} className="card kb-card">
              <div className="kb-card-top">
                <span className="category-pill">{art.category.toUpperCase()}</span>
                <span className="kb-verifications-tag">
                  <CheckCircle2 size={13} className="text-emerald" />
                  {art.verified_solutions_count} Verified Fixes
                </span>
              </div>

              <h3 className="kb-card-title">{art.title}</h3>
              <p className="kb-card-summary">{art.summary}</p>

              {/* Steps */}
              <div className="kb-steps-container">
                <span className="kb-steps-label">Standard Operating Procedure:</span>
                <ol className="kb-numbered-steps">
                  {art.steps && art.steps.map((st, i) => (
                    <li key={i} className="kb-step-item">
                      <span>{st}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Keywords */}
              <div className="kb-keywords-row">
                {art.keywords.split(',').map((kw, i) => (
                  <span key={i} className="kw-tag">#{kw.trim()}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
