import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatMessageItem from './components/ChatMessageItem';
import FaqExplorer from './components/FaqExplorer';
import CalendarView from './components/CalendarView';

import {
  Send,
  Menu,
  RotateCcw,
  Download,
  Bot
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'msg-welcome',
  sender: 'bot',
  text: `Welcome to the **University Student Support Chatbot**.\n\nYou can ask questions regarding:\n* **Attendance Criteria & Rules** (minimum percentage, condonation procedure)\n* **Semester Examinations** (admit cards, backlogs, supplementary exams, revaluation)\n* **Academics & Leave** (credit system, CGPA calculation, medical leave application)\n* **Fee Regulations & Due Dates** (installments, refund policies)\n* **Hostel & Campus Facilities** (curfew hours, room allotments, library access)\n\nType your question below or click any of the quick suggestions.`,
  timestamp: new Date().toISOString(),
  suggestions: [
    'What are the attendance requirements?',
    'How do I download my exam admit card?',
    'What is the procedure for applying for medical leave?',
    'What happens if I fail a subject or have a backlog?'
  ]
};

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('uniguide_theme') || 'dark');
  const [currentTab, setCurrentTab] = useState('chat'); // 'chat', 'faq', 'calendar'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Conversations state (saved in localStorage)
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('university_chat_sessions');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'session-1',
        title: 'New Query',
        createdAt: new Date().toISOString(),
        messages: [DEFAULT_WELCOME_MESSAGE]
      }
    ];
  });

  const [activeChatId, setActiveChatId] = useState(() => conversations[0]?.id || 'session-1');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  const messagesEndRef = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('uniguide_theme', theme);
  }, [theme]);

  // Persist conversation sessions
  useEffect(() => {
    localStorage.setItem('university_chat_sessions', JSON.stringify(conversations));
  }, [conversations]);

  // Backend Health Ping
  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((res) => {
        if (res.ok) setIsBackendConnected(true);
      })
      .catch(() => setIsBackendConnected(false));
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (currentTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, activeChatId, loading, currentTab]);

  const currentChat = conversations.find((c) => c.id === activeChatId) || conversations[0];

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Conversation session controls
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Query',
      createdAt: new Date().toISOString(),
      messages: [DEFAULT_WELCOME_MESSAGE]
    };
    setConversations([newSession, ...conversations]);
    setActiveChatId(newId);
    setCurrentTab('chat');
    setSidebarOpen(false);
  };

  const handleDeleteChat = (convId) => {
    if (conversations.length <= 1) return;
    const remaining = conversations.filter((c) => c.id !== convId);
    setConversations(remaining);
    if (activeChatId === convId) {
      setActiveChatId(remaining[0].id);
    }
  };

  const handleClearCurrentChat = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [DEFAULT_WELCOME_MESSAGE]
            }
          : c
      )
    );
  };

  const handleExportChat = () => {
    const chat = currentChat;
    const transcript = chat.messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'user' ? 'Student' : 'Assistant'}:\n${m.text}\n`
      )
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `University_Chat_${chat.title.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Send query logic with conversation memory
  const handleSendMessage = useCallback(async (queryText) => {
    const textToSend = (typeof queryText === 'string' ? queryText : inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newUserMsg = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    // Update conversation state & title if first student question
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          const isFirstUserMsg = !c.messages.some((m) => m.sender === 'user');
          const title = isFirstUserMsg
            ? textToSend.length > 25
              ? textToSend.substring(0, 25) + '...'
              : textToSend
            : c.title;

          return {
            ...c,
            title,
            messages: [...c.messages, newUserMsg]
          };
        }
        return c;
      })
    );

    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = currentChat.messages
        .filter((m) => m.id !== 'msg-welcome')
        .map((m) => ({
          sender: m.sender,
          text: m.text
        }));

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const botMsgId = `bot-${Date.now()}`;
      const newBotMsg = {
        id: botMsgId,
        sender: 'bot',
        text: data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
        suggestions: data.suggestions || []
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: [...c.messages, newBotMsg]
            };
          }
          return c;
        })
      );

      setIsBackendConnected(true);
    } catch (err) {
      console.error('Chat error:', err);
      setIsBackendConnected(false);

      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `Unable to connect to the backend server at \`${API_URL}\`.\nPlease ensure the backend is running via \`uvicorn main:app --reload\`.`,
        timestamp: new Date().toISOString(),
        suggestions: [
          'What are the attendance requirements?',
          'How can I get information about exams?'
        ]
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, messages: [...c.messages, errorMsg] } : c))
      );
    } finally {
      setLoading(false);
    }
  }, [inputMessage, loading, activeChatId, currentChat]);

  const handleAskFromOtherTab = (question) => {
    setCurrentTab('chat');
    handleSendMessage(question);
  };

  // Quick Action Buttons
  const quickCategories = [
    { label: 'Attendance Criteria', query: 'What are the attendance requirements and medical condonation rules?' },
    { label: 'Exam & Admit Card', query: 'How do I download my exam admit card and check schedules?' },
    { label: 'Backlogs & Reval', query: 'What is the procedure for supplementary exam and revaluation?' },
    { label: 'Leave Procedure', query: 'What is the official procedure for applying for student leave?' },
    { label: 'Hostel Rules', query: 'What are the hostel curfew timings and leave rules?' }
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSidebarOpen(false);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Area */}
      <main className="app-main-viewport">
        {/* Top Navbar with Centered Heading */}
        <header className="main-navbar">
          <div className="navbar-left">
            <button
              className="mobile-hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <div className="session-status-tag">
              <span className={`status-dot ${isBackendConnected ? 'online' : 'offline'}`} />
              <span className="status-text">{isBackendConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          {/* Centered Heading */}
          <div className="navbar-center">
            <h1 className="top-center-heading">University Chat-Bot</h1>
          </div>

          <div className="navbar-right">
            {currentTab === 'chat' && (
              <>
                <button
                  className="nav-action-icon-btn"
                  onClick={handleClearCurrentChat}
                  title="Clear messages"
                >
                  <RotateCcw size={14} />
                  <span>Clear</span>
                </button>
                <button
                  className="nav-action-icon-btn"
                  onClick={handleExportChat}
                  title="Export conversation"
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Viewport Content */}
        <div className="main-view-body">
          {currentTab === 'chat' && (
            <div className="chat-interface-wrapper">
              {/* Messages Scroll Area */}
              <div className="chat-messages-scroll-area">
                <div className="messages-list">
                  {currentChat.messages.map((msg, index) => (
                    <ChatMessageItem
                      key={msg.id || index}
                      message={msg}
                      isLatest={index === currentChat.messages.length - 1}
                      onSelectSuggestion={handleSendMessage}
                    />
                  ))}

                  {loading && (
                    <div className="message-row bot loading-row">
                      <div className="message-avatar">
                        <div className="avatar-bot-box">
                          <Bot size={16} />
                        </div>
                      </div>
                      <div className="loading-card">
                        <div className="typing-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                        <span className="loading-text">Fetching verified university information...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat Input Dock */}
              <div className="chat-bottom-dock">
                {/* Quick Suggestion Pills */}
                <div className="quick-topics-scroller">
                  {quickCategories.map((item, i) => (
                    <button
                      key={i}
                      className="quick-topic-chip"
                      onClick={() => handleSendMessage(item.query)}
                      disabled={loading}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Clean Input Box (No voice button) */}
                <div className="chat-input-bar">
                  <textarea
                    rows={1}
                    className="chat-textarea"
                    placeholder="Type your university query here (e.g. attendance criteria, exams, fees)..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <button
                    className="send-message-btn"
                    onClick={() => handleSendMessage()}
                    disabled={loading || !inputMessage.trim()}
                    title="Send query"
                  >
                    <Send size={16} />
                  </button>
                </div>

                <div className="input-disclaimer-text">
                  Official university regulations and notices take precedence over automated responses.
                </div>
              </div>
            </div>
          )}

          {currentTab === 'faq' && (
            <FaqExplorer onAskQuestion={handleAskFromOtherTab} apiUrl={API_URL} />
          )}

          {currentTab === 'calendar' && (
            <CalendarView onAskQuestion={handleAskFromOtherTab} apiUrl={API_URL} />
          )}
        </div>
      </main>
    </div>
  );
}