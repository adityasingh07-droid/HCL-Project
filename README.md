# 🎓 UniGuide AI — University Campus & Student Support Assistant 2.0

An AI-powered campus support ecosystem built with **FastAPI**, **Google Gemini 3.5 Flash**, **React 19**, and **Vite**. UniGuide delivers contextual answers for students across academics, examinations, attendance, hostel accommodation, fee structures, scholarships, placements, and campus emergencies.

---

## ✨ Features & Enhancements

### 🎨 1. Modern Glassmorphic UI & Design System
- **Theme Engine**: Seamless toggle between **Deep Slate Cyber Dark** and **Luminescent Studio Light** modes.
- **Glassmorphic Cards**: Multi-layer frosted cards with dynamic ambient floating mesh gradient orbs.
- **Typography Hierarchy**: Integrated **Outfit** (headings & display) and **Plus Jakarta Sans** (crisp body text).
- **Sound Effects Engine**: Gentle modern audio chimes for sending messages and receiving responses synthesized with the **Web Audio API** (zero external asset loading lag).
- **Celebratory Confetti**: Interactive animations when copying responses, asking questions, and indexing documents.

### 💬 2. Context-Aware Multi-Turn Conversational AI
- **Multi-Turn Context**: Preserves conversation history across turns, allowing students to ask contextual follow-up questions (e.g., *"What are the hostel curfew hours?"* followed by *"What about weekends?"*).
- **Markdown & Code Rendering**: Rich formatting with bullet points, styled blockquotes, bold emphasis, and clean headers.
- **Contextual Suggestion Chips**: Underneath every AI reply, dynamic 2–3 follow-up question chips are generated for 1-click continuation.
- **Action Bar per Message**:
  - 📋 **1-Click Copy** to clipboard with toast confirmation.
  - 🔊 **Text-to-Speech (Audio Readout)** using the browser Web Speech Synthesis API.
  - 👍 / 👎 **Helpfulness Rating** buttons.
- **🎙️ Speech-to-Text Voice Input**: Speak directly into the microphone with glowing real-time recording feedback.
- **Multi-Session Management**: Multiple concurrent chat threads saved in `localStorage` with auto-titling, thread switching, clear chat, and **Markdown transcript export**.

### 📚 3. Campus Knowledge Base Hub
- Direct access to **100+ university FAQs** categorized into 18 campus domains:
  - *Academics, Attendance, Examinations, Leave, Admission, Fees, Hostel, Library, Placements, Scholarships, IT Support, Emergency, Complaints, Campus Life, Student Clubs, etc.*
- **Live Search & Category Filters**: Real-time filtering with instant answer preview and *"Ask AI"* button.

### 🏛️ 4. Campus Department Directory & Emergency Hotlines
- **24/7 Priority Emergency Banner**: Quick-dial tags for Campus Security, Medical Emergency, and Anti-Ragging Hotline.
- **Office Cards**: Direct email, telephone, room location, and operational hours for the Examination Cell, Registrar, Dean of Student Welfare, Central Library, Accounts, and Placement Cell.

### 📅 5. Academic Calendar & Milestone Timeline
- Visual interactive timeline covering semester registrations, mid-term examinations, tuition fee deadlines, cultural festivals, end-term exams, and vacations with status tags (*Completed*, *Ongoing*, *Upcoming*).

### 📄 6. Dynamic Document RAG Ingestion
- Upload `.pdf` or `.txt` student circulars or policy documents (such as the included `campus_policy_handbook.txt`) directly through the portal to index new rules into the AI's memory without restarting the backend.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **Gemini API Key** (configured in `backend/.env`)

---

### Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r requirements.txt  # fastapi, uvicorn, google-genai, pypdf, python-multipart, python-dotenv

# Start FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation is available at `http://127.0.0.1:8000/docs`.

---

### Frontend Setup (React + Vite)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open **`http://127.0.0.1:5173/`** in your browser.

---

## 🏛️ Project Structure

```
University Chat-Bot/
├── backend/
│   ├── data/
│   │   └── faq.json                     # 100 categorized university FAQs
│   ├── document/
│   │   └── campus_policy_handbook.txt   # Campus policy & guidelines handbook
│   ├── .env                             # Environment configuration (Gemini API Key)
│   ├── main.py                          # Upgraded FastAPI server with Gemini & RAG
│   └── venv/                            # Python virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx              # Navigation, sessions, theme & sound toggles
│   │   │   ├── ChatMessageItem.jsx      # Markdown message, TTS, copy, & suggestions
│   │   │   ├── FaqExplorer.jsx          # Searchable 100+ FAQ knowledge hub
│   │   │   ├── DirectoryView.jsx        # Department directory & emergency lines
│   │   │   ├── CalendarView.jsx         # Academic milestones timeline
│   │   │   └── UploadModal.jsx          # Circular & handbook file upload
│   │   ├── utils/
│   │   │   └── soundEffects.js          # Web Audio API sound synthesizer
│   │   ├── App.jsx                      # Master portal coordinator & state
│   │   ├── App.css                      # Modern glassmorphism & responsive CSS
│   │   ├── index.css                    # Design tokens & dark/light theme definitions
│   │   └── main.jsx                     # Application entry point
│   ├── index.html                       # HTML5 template with Google Fonts (Outfit & Jakarta)
│   └── package.json                     # Dependencies (React 19, Lucide, Marked, Confetti)
└── README.md                            # Complete documentation
```
