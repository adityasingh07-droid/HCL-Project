import { useState } from 'react';
import { marked } from 'marked';
import { Copy, Check, ThumbsUp, ThumbsDown, Bot, User, ArrowRight } from 'lucide-react';

marked.setOptions({
  gfm: true,
  breaks: true
});

export default function ChatMessageItem({
  message,
  isLatest,
  onSelectSuggestion
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isBot = message.sender === 'bot';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type) => {
    setFeedback((prev) => (prev === type ? null : type));
  };

  const renderContent = () => {
    if (!isBot) {
      return <div className="user-text-content">{message.text}</div>;
    }

    try {
      const parsedHtml = marked.parse(message.text);
      return (
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      );
    } catch {
      return <div className="markdown-body">{message.text}</div>;
    }
  };

  return (
    <div className={`message-row ${message.sender}`}>
      <div className="message-avatar">
        {isBot ? (
          <div className="avatar-bot-box">
            <Bot size={16} />
          </div>
        ) : (
          <div className="avatar-user-box">
            <User size={16} />
          </div>
        )}
      </div>

      <div className="message-content-wrapper">
        <div className="message-header-info">
          <span className="sender-name">
            {isBot ? 'University Assistant' : 'You'}
          </span>
          <span className="message-time">
            {message.timestamp
              ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>
        </div>

        <div className={`message-bubble ${message.sender}`}>
          {renderContent()}

          {/* Action bar for Bot messages */}
          {isBot && (
            <div className="bot-actions-bar">
              <button
                className={`action-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy response to clipboard"
              >
                {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <div className="feedback-group">
                <button
                  className={`feedback-btn ${feedback === 'up' ? 'active-up' : ''}`}
                  onClick={() => handleFeedback('up')}
                  title="Helpful"
                >
                  <ThumbsUp size={13} />
                </button>
                <button
                  className={`feedback-btn ${feedback === 'down' ? 'active-down' : ''}`}
                  onClick={() => handleFeedback('down')}
                  title="Not helpful"
                >
                  <ThumbsDown size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Follow-up chips */}
        {isBot && isLatest && message.suggestions && message.suggestions.length > 0 && (
          <div className="followup-suggestions-container">
            <span className="suggestions-label">Related Questions:</span>
            <div className="suggestions-list">
              {message.suggestions.map((sug, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => onSelectSuggestion(sug)}
                >
                  <ArrowRight size={11} className="sug-icon" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
