/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, Send, Copy, Check, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FaqExplorer({ onAskQuestion, apiUrl = 'http://127.0.0.1:8000' }) {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/faq`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
        
        // Extract categories
        const cats = new Set(data.faqs.map(f => f.category || 'General'));
        setCategories(['All', ...Array.from(cats)]);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || (faq.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    confetti({
      particleCount: 20,
      spread: 35,
      origin: { y: 0.7 },
      colors: ['#4f46e5', '#10b981']
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="portal-view-container">
      {/* View Header */}
      <div className="portal-view-header">
        <div className="view-title-group">
          <div className="view-icon-badge">
            <BookOpen size={24} />
          </div>
          <div>
            <h2>Campus Knowledge Base</h2>
            <p>Explore 100+ official guidelines, FAQs, and regulations instantly</p>
          </div>
        </div>
        <div className="view-count-badge">
          <span>{filteredFaqs.length} Questions</span>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="faq-toolbar">
        <div className="faq-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search rules, fees, exams, attendance, hostel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* Category Chips Bar */}
        <div className="category-scroll-bar">
          <div className="category-list">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQs Grid / List */}
      <div className="faq-cards-grid">
        {loading ? (
          <div className="loading-state-card">
            <div className="loading-spinner" />
            <p>Loading university knowledge base...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="empty-faq-state">
            <Filter size={36} className="text-muted" />
            <h3>No questions found</h3>
            <p>Try searching for different keywords or select "All" categories.</p>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => (
            <div key={idx} className="faq-card">
              <div className="faq-card-header">
                <span className="faq-category-tag">
                  {faq.category || 'General'}
                </span>
                <div className="card-actions">
                  <button
                    className="icon-action-btn"
                    onClick={() => handleCopy(faq.answer, idx)}
                    title="Copy Answer"
                  >
                    {copiedIndex === idx ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  </button>
                  <button
                    className="ask-ai-pill-btn"
                    onClick={() => onAskQuestion(faq.question)}
                    title="Ask UniGuide in chat"
                  >
                    <Send size={12} />
                    <span>Ask AI</span>
                  </button>
                </div>
              </div>

              <h4 className="faq-question-title">{faq.question}</h4>
              <p className="faq-answer-body">{faq.answer}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
