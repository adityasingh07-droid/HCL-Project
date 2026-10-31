import {
  GraduationCap,
  Plus,
  MessageSquare,
  BookOpen,
  Calendar,
  Moon,
  Sun,
  Trash2,
  Server,
  X
} from 'lucide-react';

export default function Sidebar({
  conversations,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  currentTab,
  onSelectTab,
  theme,
  onToggleTheme,
  isOpen,
  onCloseMobile,
  faqCount = 100,
  isBackendConnected = true
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-box">
            <GraduationCap size={22} className="brand-icon" />
          </div>
          <div className="brand-text">
            <h2>UniBot</h2>
            <span className="brand-tag">Student Support System</span>
          </div>
          <button className="mobile-close-btn" onClick={onCloseMobile}>
            <X size={20} />
          </button>
        </div>

        {/* New Query / Chat Button */}
        <div className="sidebar-action-wrap">
          <button className="new-chat-btn" onClick={onNewChat}>
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Feature Navigation Tabs */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">PORTAL NAVIGATION</div>
          
          <button
            className={`nav-item ${currentTab === 'chat' ? 'active' : ''}`}
            onClick={() => onSelectTab('chat')}
          >
            <MessageSquare size={16} />
            <span className="nav-label">Chat Assistant</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'faq' ? 'active' : ''}`}
            onClick={() => onSelectTab('faq')}
          >
            <BookOpen size={16} />
            <span className="nav-label">FAQ Knowledge Base</span>
            <span className="nav-badge">{faqCount}</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'calendar' ? 'active' : ''}`}
            onClick={() => onSelectTab('calendar')}
          >
            <Calendar size={16} />
            <span className="nav-label">Academic Calendar</span>
          </button>
        </nav>

        {/* Saved Sessions History */}
        <div className="sidebar-history-section">
          <div className="nav-section-title">RECENT QUERIES</div>
          <div className="history-scroll-list">
            {conversations.length === 0 ? (
              <div className="empty-history">No past queries</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`history-item ${conv.id === activeChatId && currentTab === 'chat' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectChat(conv.id);
                    onSelectTab('chat');
                  }}
                >
                  <MessageSquare size={14} className="history-icon" />
                  <span className="history-title" title={conv.title}>
                    {conv.title || 'Query'}
                  </span>
                  {conversations.length > 1 && (
                    <button
                      className="delete-conv-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(conv.id);
                      }}
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Status & Theme Toggle */}
        <div className="sidebar-footer">
          <div className="connection-status-pill">
            <Server size={13} className={isBackendConnected ? 'text-emerald' : 'text-rose'} />
            <span>{isBackendConnected ? 'FastAPI: 127.0.0.1:8000' : 'Backend Disconnected'}</span>
          </div>

          <div className="footer-controls">
            <button
              className="footer-btn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
