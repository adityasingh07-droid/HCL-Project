/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle, Send } from 'lucide-react';

export default function CalendarView({ onAskQuestion, apiUrl = 'http://127.0.0.1:8000' }) {
  const [calendar, setCalendar] = useState([]);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/academic-calendar`);
      if (res.ok) {
        const data = await res.json();
        setCalendar(data.calendar || []);
      }
    } catch (err) {
      console.error('Failed to load calendar:', err);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="cal-badge completed">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'Ongoing':
        return (
          <span className="cal-badge ongoing">
            <Clock size={12} />
            Ongoing
          </span>
        );
      default:
        return (
          <span className="cal-badge upcoming">
            <AlertCircle size={12} />
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="portal-view-container">
      {/* Header */}
      <div className="portal-view-header">
        <div className="view-title-group">
          <div className="view-icon-badge">
            <Calendar size={24} />
          </div>
          <div>
            <h2>Academic Calendar & Deadlines</h2>
            <p>Official timeline of examinations, course registrations, and semester breaks</p>
          </div>
        </div>
      </div>

      {/* Calendar Timeline */}
      <div className="calendar-timeline">
        {calendar.map((item, index) => (
          <div key={index} className="timeline-node">
            <div className="timeline-marker">
              <div className="marker-dot" />
              {index < calendar.length - 1 && <div className="marker-line" />}
            </div>

            <div className="timeline-card">
              <div className="timeline-card-header">
                <div className="date-tag-badge">
                  <Calendar size={13} />
                  <span>{item.date}</span>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <h3 className="event-title">{item.event}</h3>
              <div className="timeline-card-footer">
                <span className="event-type-tag">Category: {item.type}</span>
                <button
                  className="ask-ai-pill-btn"
                  onClick={() => onAskQuestion(`What are the details and requirements for ${item.event} on ${item.date}?`)}
                >
                  <Send size={12} />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
