import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, FileCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function UploadModal({ onAskQuestion, apiUrl = 'http://127.0.0.1:8000' }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setStatus(null);

    try {
      const res = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: 'success',
          message: data.message || `File '${file.name}' successfully indexed into AI knowledge base!`
        });
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
        setFile(null);
      } else {
        setStatus({
          type: 'error',
          message: data.detail || 'Upload failed. Please check the file format.'
        });
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Could not connect to the server to upload the document.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="portal-view-container">
      {/* Header */}
      <div className="portal-view-header">
        <div className="view-title-group">
          <div className="view-icon-badge">
            <UploadCloud size={24} />
          </div>
          <div>
            <h2>Upload Campus Circulars & Guidelines</h2>
            <p>Upload official university PDF or TXT notices to dynamically expand UniGuide's knowledge</p>
          </div>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="upload-container-card">
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="doc-upload-input"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div className="drop-zone-content">
            <div className="upload-icon-circle">
              {file ? <FileCheck size={36} className="text-emerald" /> : <UploadCloud size={36} />}
            </div>

            {file ? (
              <div className="selected-file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <>
                <h3>Drag & Drop University PDF or TXT Document</h3>
                <p>or click browse to select a file from your computer</p>
                <span className="supported-formats">Supported formats: PDF, TXT (Max 15MB)</span>
              </>
            )}

            <label htmlFor="doc-upload-input" className="browse-files-btn">
              {file ? 'Choose Different File' : 'Browse File'}
            </label>
          </div>
        </div>

        {file && (
          <div className="upload-action-row">
            <button
              className="confirm-upload-btn"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="mini-spinner" />
                  <span>Indexing Document...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Upload & Index Document</span>
                </>
              )}
            </button>
          </div>
        )}

        {status && (
          <div className={`status-alert-box ${status.type}`}>
            {status.type === 'success' ? (
              <CheckCircle2 size={20} className="text-emerald" />
            ) : (
              <AlertTriangle size={20} className="text-rose" />
            )}
            <p>{status.message}</p>
          </div>
        )}

        {/* Currently Indexed Documents Info */}
        <div className="indexed-docs-info">
          <h4>Active Knowledge Documents:</h4>
          <div className="indexed-doc-badge">
            <FileText size={16} />
            <div className="doc-meta">
              <span className="doc-title">campus_policy_handbook.txt</span>
              <span className="doc-desc">Covers 75% attendance policy, grading scales, hostel curfews, Wi-Fi setup & scholarships</span>
            </div>
            <button
              className="doc-query-btn"
              onClick={() => onAskQuestion('What are the hostel curfew and attendance condonation rules mentioned in the policy handbook?')}
            >
              <span>Test Knowledge</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
