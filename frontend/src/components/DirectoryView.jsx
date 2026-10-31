/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldAlert,
  Send,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DirectoryView({ onAskQuestion, apiUrl = 'http://127.0.0.1:8000' }) {
  const [directory, setDirectory] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchDirectory = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/directory`);
      if (res.ok) {
        const data = await res.json();
        setDirectory(data.directory || []);
      }
    } catch (err) {
      console.error('Failed to load directory:', err);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  const copyInfo = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    confetti({
      particleCount: 15,
      spread: 30,
      origin: { y: 0.7 },
      colors: ['#6366f1', '#10b981']
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="portal-view-container">
      {/* Header */}
      <div className="portal-view-header">
        <div className="view-title-group">
          <div className="view-icon-badge">
            <Building2 size={24} />
          </div>
          <div>
            <h2>Campus Department Directory</h2>
            <p>Direct contact lines, office locations, and emergency support services</p>
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="emergency-banner-card">
        <div className="emergency-icon-glow">
          <ShieldAlert size={28} />
        </div>
        <div className="emergency-content">
          <h3>24/7 Campus Emergency & Safety Hotlines</h3>
          <p>For immediate medical assistance, campus security, or reporting distress, contact these priority lines immediately:</p>
          <div className="emergency-numbers-row">
            <a href="tel:18001117233" className="emergency-tag-link">
              <Phone size={14} />
              <span>Anti-Ragging Helpline: 1800-111-SAFE (7233)</span>
            </a>
            <a href="tel:5550199911" className="emergency-tag-link">
              <Phone size={14} />
              <span>Medical Emergency: +1 (555) 019-9911</span>
            </a>
          </div>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="directory-cards-grid">
        {directory.map((dept, index) => (
          <div key={index} className="directory-card">
            <div className="dept-card-top">
              <h3 className="dept-title">{dept.department}</h3>
              <button
                className="ask-ai-pill-btn"
                onClick={() => onAskQuestion(`What are the contact details and procedures for ${dept.department}?`)}
                title="Ask Assistant about this department"
              >
                <Send size={12} />
                <span>Ask AI</span>
              </button>
            </div>

            <p className="dept-desc">{dept.description}</p>

            <div className="dept-details-list">
              <div className="detail-item">
                <Mail size={15} className="detail-icon" />
                <a href={`mailto:${dept.email}`} className="detail-link">
                  {dept.email}
                </a>
                <button
                  className="mini-copy-btn"
                  onClick={() => copyInfo(dept.email, `mail-${index}`)}
                  title="Copy Email"
                >
                  {copiedKey === `mail-${index}` ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                </button>
              </div>

              <div className="detail-item">
                <Phone size={15} className="detail-icon" />
                <a href={`tel:${dept.phone}`} className="detail-link">
                  {dept.phone}
                </a>
                <button
                  className="mini-copy-btn"
                  onClick={() => copyInfo(dept.phone, `tel-${index}`)}
                  title="Copy Phone"
                >
                  {copiedKey === `tel-${index}` ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                </button>
              </div>

              <div className="detail-item">
                <MapPin size={15} className="detail-icon" />
                <span className="detail-text">{dept.location}</span>
              </div>

              <div className="detail-item">
                <Clock size={15} className="detail-icon" />
                <span className="detail-text">{dept.hours}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
