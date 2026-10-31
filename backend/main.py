import os
import json
import re
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from pypdf import PdfReader

# ==========================================
# LOAD ENVIRONMENT & SETUP PATHS
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATA_DIR = os.path.join(BASE_DIR, "data")
DOCUMENTS_DIR = os.path.join(BASE_DIR, "document")
os.makedirs(DOCUMENTS_DIR, exist_ok=True)

# Also support legacy "documents" folder if present
LEGACY_DOCS_DIR = os.path.join(BASE_DIR, "documents")
if os.path.exists(LEGACY_DOCS_DIR):
    DOC_DIRS = [DOCUMENTS_DIR, LEGACY_DOCS_DIR]
else:
    DOC_DIRS = [DOCUMENTS_DIR]

app = FastAPI(
    title="University Student Support AI Assistant",
    description="Intelligent AI assistant API with Gemini integration, FAQ retrieval, and Document RAG.",
    version="2.0.0"
)

# ==========================================
# CORS SETUP
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local dev & preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# GEMINI CLIENT & MODEL CONFIG
# ==========================================

gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
client = None
if gemini_key:
    try:
        client = genai.Client(api_key=gemini_key)
    except Exception as e:
        print(f"Warning: Gemini client initialization error: {e}")

PREFERRED_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-flash-latest"
]

# ==========================================
# LOAD KNOWLEDGE BASES
# ==========================================

faq_file_path = os.path.join(DATA_DIR, "faq.json")
university_data = []

if os.path.exists(faq_file_path):
    try:
        with open(faq_file_path, "r", encoding="utf-8") as f:
            university_data = json.load(f)
        print(f"Loaded {len(university_data)} FAQ entries.")
    except Exception as e:
        print(f"Error loading FAQ data: {e}")
        university_data = []
else:
    print(f"FAQ file not found at {faq_file_path}")


def load_pdf_documents():
    """Extracts text from all PDFs and text documents in document directories."""
    all_text = ""
    seen_files = set()
    total_docs = 0

    for directory in DOC_DIRS:
        if not os.path.exists(directory):
            continue
        for filename in os.listdir(directory):
            if filename in seen_files:
                continue
            seen_files.add(filename)
            file_path = os.path.join(directory, filename)

            if filename.lower().endswith(".pdf"):
                try:
                    reader = PdfReader(file_path)
                    for page_num, page in enumerate(reader.pages):
                        txt = page.extract_text()
                        if txt:
                            all_text += f"\n\n--- [Document: {filename} - Page {page_num + 1}] ---\n{txt}"
                    total_docs += 1
                except Exception as err:
                    print(f"Error reading PDF {filename}: {err}")
            elif filename.lower().endswith((".txt", ".md")):
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as tf:
                        all_text += f"\n\n--- [Notice: {filename}] ---\n{tf.read()}"
                    total_docs += 1
                except Exception as err:
                    print(f"Error reading text document {filename}: {err}")

    print(f"Indexed {total_docs} campus documents ({len(all_text)} chars).")
    return all_text


pdf_knowledge = load_pdf_documents()

# Campus Directory Knowledge
CAMPUS_DIRECTORY = [
    {
        "department": "Examination Cell",
        "description": "Admit cards, semester exams, grade cards, revaluation",
        "email": "exams@university.edu",
        "phone": "+1 (555) 019-2831",
        "location": "Admin Block, 2nd Floor, Room 204",
        "hours": "Mon-Fri: 9:00 AM - 5:00 PM"
    },
    {
        "department": "Registrar Office",
        "description": "Admissions, verification, official transcripts, migration",
        "email": "registrar@university.edu",
        "phone": "+1 (555) 019-2832",
        "location": "Central Administration Building, Ground Floor",
        "hours": "Mon-Fri: 9:30 AM - 4:30 PM"
    },
    {
        "department": "Dean of Student Welfare",
        "description": "Hostel affairs, student grievances, clubs, extracurriculars",
        "email": "dsw@university.edu",
        "phone": "+1 (555) 019-2835",
        "location": "Student Activity Center (SAC), Room 102",
        "hours": "Mon-Fri: 10:00 AM - 6:00 PM"
    },
    {
        "department": "Central Library",
        "description": "Book issue/return, digital repository, study spaces, research journals",
        "email": "library@university.edu",
        "phone": "+1 (555) 019-2840",
        "location": "Knowledge Hub Building",
        "hours": "Mon-Sat: 8:00 AM - 10:00 PM"
    },
    {
        "department": "Accounts & Finance Department",
        "description": "Tuition fees, payment receipts, refunds, installment requests",
        "email": "accounts@university.edu",
        "phone": "+1 (555) 019-2844",
        "location": "Finance Wing, 1st Floor",
        "hours": "Mon-Fri: 9:30 AM - 3:30 PM"
    },
    {
        "department": "Training & Placement Cell",
        "description": "Campus placements, internships, career counseling, resume reviews",
        "email": "placements@university.edu",
        "phone": "+1 (555) 019-2850",
        "location": "Career Development Centre, 3rd Floor",
        "hours": "Mon-Fri: 9:00 AM - 6:00 PM"
    },
    {
        "department": "Campus Health & Medical Centre",
        "description": "24/7 First aid, doctor consultations, emergency care, medical leave certificates",
        "email": "healthcenter@university.edu",
        "phone": "+1 (555) 019-9911",
        "location": "Health Center near Gate 2",
        "hours": "24/7 Emergency Service"
    },
    {
        "department": "Hostel & Residence Office",
        "description": "Room allotment, mess queries, hostel leave passes, maintenance",
        "email": "hostel@university.edu",
        "phone": "+1 (555) 019-2866",
        "location": "Chief Warden Office, Hostel Complex",
        "hours": "Mon-Sat: 8:30 AM - 7:00 PM"
    },
    {
        "department": "Campus Security & Anti-Ragging Helpline",
        "description": "Immediate campus safety, emergency assistance, toll-free 24/7 hotline",
        "email": "security@university.edu",
        "phone": "+1 (800) 111-SAFE (7233)",
        "location": "Main Entrance Security HQ",
        "hours": "24/7 Immediate Response"
    }
]

# Academic Calendar Milestones
ACADEMIC_CALENDAR = [
    {"event": "Semester Course Registration", "date": "August 1 - August 10", "type": "registration", "status": "Completed"},
    {"event": "Commencement of Classes", "date": "August 16", "type": "academic", "status": "Ongoing"},
    {"event": "Mid-Semester Examinations", "date": "October 12 - October 20", "type": "exam", "status": "Upcoming"},
    {"event": "Last Date for Fee Payment (without late fee)", "date": "October 30", "type": "deadline", "status": "Upcoming"},
    {"event": "Annual Tech & Cultural Festival", "date": "November 14 - November 17", "type": "event", "status": "Upcoming"},
    {"event": "End-Semester Practical Exams", "date": "December 1 - December 8", "type": "exam", "status": "Upcoming"},
    {"event": "End-Semester Theory Examinations", "date": "December 12 - December 24", "type": "exam", "status": "Upcoming"},
    {"event": "Winter Vacation", "date": "December 25 - January 10", "type": "break", "status": "Scheduled"}
]

# ==========================================
# MODELS & SCHEMAS
# ==========================================

class MessageHistoryItem(BaseModel):
    sender: str  # 'user' or 'bot'
    text: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[MessageHistoryItem]] = []

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def find_best_local_match(query: str):
    """Fallback keyword/semantic matching against FAQ data if AI is offline."""
    query_tokens = set(re.findall(r'\w+', query.lower()))
    best_item = None
    highest_score = 0

    for item in university_data:
        q_tokens = set(re.findall(r'\w+', item['question'].lower()))
        common = query_tokens.intersection(q_tokens)
        score = len(common)
        
        # Boost category match
        cat = item.get('category', '').lower()
        if any(cat in tok for tok in query_tokens):
            score += 1.5

        if score > highest_score:
            highest_score = score
            best_item = item

    if best_item and highest_score >= 1:
        return best_item
    return None


def generate_suggested_questions(user_message: str, reply: str) -> List[str]:
    """Generates intelligent context-aware follow-up suggestion chips."""
    msg = user_message.lower() + " " + reply.lower()
    
    if any(k in msg for k in ["attend", "absent", "percentage", "shortage"]):
        return [
            "What is the procedure for medical leave?",
            "Can attendance shortage be condoned?",
            "How do I check my current attendance?"
        ]
    elif any(k in msg for k in ["exam", "backlog", "supplementary", "reval", "admit"]):
        return [
            "How can I download my admit card?",
            "What is the procedure for revaluation?",
            "What happens if I miss an examination?"
        ]
    elif any(k in msg for k in ["fee", "payment", "scholarship", "installment"]):
        return [
            "What scholarships are available?",
            "What is the fee payment deadline?",
            "How do I get a fee receipt or refund?"
        ]
    elif any(k in msg for k in ["hostel", "room", "mess", "warden"]):
        return [
            "How do I apply for hostel accommodation?",
            "What are the hostel entry timings?",
            "Who should I contact for hostel maintenance?"
        ]
    elif any(k in msg for k in ["placement", "job", "internship", "company"]):
        return [
            "What are the placement eligibility criteria?",
            "How do I register for campus placement?",
            "Can I apply for off-campus internships?"
        ]
    elif any(k in msg for k in ["admission", "apply", "eligibility", "documents"]):
        return [
            "What documents are needed for admission?",
            "What is the admission refund policy?",
            "When will the merit list be announced?"
        ]
    elif any(k in msg for k in ["library", "book", "journal", "fine"]):
        return [
            "What are the library operating hours?",
            "How many books can a student borrow?",
            "How can I access digital journals?"
        ]
    else:
        return [
            "What are the attendance requirements?",
            "How do I contact the Examination Cell?",
            "Where can I find the academic calendar?"
        ]

# ==========================================
# ROUTES
# ==========================================

@app.get("/")
def home():
    return {
        "status": "online",
        "name": "University Student Support AI Assistant",
        "version": "2.0.0",
        "faqs_loaded": len(university_data),
        "docs_indexed": len(pdf_knowledge) > 0,
        "active_models": PREFERRED_MODELS
    }


@app.get("/faq")
def get_faqs(category: Optional[str] = None, search: Optional[str] = None):
    """Retrieve filtered or searched FAQs."""
    results = university_data
    if category and category.lower() != "all":
        results = [item for item in results if item.get("category", "").lower() == category.lower()]
    if search:
        search_lower = search.lower()
        results = [
            item for item in results
            if search_lower in item["question"].lower() or search_lower in item["answer"].lower()
        ]
    return {
        "total": len(results),
        "faqs": results[:50]
    }


@app.get("/faq/categories")
def get_faq_categories():
    """Retrieve all categories with their question counts."""
    counts = {}
    for item in university_data:
        cat = item.get("category", "General")
        counts[cat] = counts.get(cat, 0) + 1
    return {
        "categories": [{"name": k, "count": v} for k, v in sorted(counts.items())]
    }


@app.get("/directory")
def get_directory():
    """Retrieve university key department directory and emergency hotlines."""
    return {
        "directory": CAMPUS_DIRECTORY
    }


@app.get("/academic-calendar")
def get_calendar():
    """Retrieve important semester milestones and deadlines."""
    return {
        "calendar": ACADEMIC_CALENDAR
    }


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a new campus document (PDF, TXT) to augment knowledge base."""
    global pdf_knowledge
    if not (file.filename.lower().endswith(".pdf") or file.filename.lower().endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are accepted.")

    save_path = os.path.join(DOCUMENTS_DIR, file.filename)
    try:
        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)
        # Reload knowledge
        pdf_knowledge = load_pdf_documents()
        return {
            "success": True,
            "filename": file.filename,
            "message": f"Document '{file.filename}' successfully uploaded and indexed into knowledge base!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@app.post("/chat")
def chat(request: ChatRequest):
    """Main intelligent conversational chat endpoint."""
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    # 1. Format FAQ Knowledge
    faq_knowledge = "\n\n".join(
        [
            f"Category: {item.get('category', 'General')}\nQuestion: {item['question']}\nAnswer: {item['answer']}"
            for item in university_data
        ]
    )

    # 2. Format Conversation History (last 6 turns for context)
    recent_history = request.history[-6:] if request.history else []
    history_text = ""
    if recent_history:
        history_text = "CONVERSATION HISTORY:\n" + "\n".join(
            [f"{'Student' if m.sender == 'user' else 'Assistant'}: {m.text}" for m in recent_history]
        ) + "\n\n"

    # 3. System Prompt
    system_prompt = f"""You are "UniGuide", an AI-powered Student Support Assistant for the University.
Your mission is to provide warm, accurate, professional, and clear guidance to students, applicants, and faculty.

ASSISTANT GUIDELINES:
1. Ground your answers strictly on the provided University FAQ and Campus Documents below.
2. Structure your answers neatly with markdown headings, bullet points, and bold text for readability.
3. If specific dates, fees, or percentages are required and NOT in the reference knowledge, clearly state that official confirmation should be obtained from the respective department, and name the specific department.
4. Keep the tone encouraging, empathetic, and student-focused.
5. Provide actionable next steps (e.g. portal links or office locations) where applicable.
6. Never fabricate official university regulations or claim access to personal student grades/records.

========================================
CAMPUS DEPARTMENT DIRECTORY
========================================
{json.dumps(CAMPUS_DIRECTORY, indent=2)}

========================================
UNIVERSITY FAQ KNOWLEDGE BASE
========================================
{faq_knowledge}

========================================
OFFICIAL DOCUMENTS & NOTICES
========================================
{pdf_knowledge if pdf_knowledge else "No additional PDF documents currently uploaded."}

{history_text}========================================
CURRENT STUDENT QUESTION
========================================
{user_query}

========================================
YOUR COMPREHENSIVE RESPONSE (using Markdown formatting):
"""

    reply_text = ""
    model_used = "local-faq-engine"

    # 4. Try Gemini Generation with fallback models
    if client:
        for model_name in PREFERRED_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=system_prompt
                )
                if response and response.text:
                    reply_text = response.text
                    model_used = model_name
                    break
            except Exception as err:
                print(f"Gemini call failed with model {model_name}: {err}")
                continue

    # 5. Fallback to Local Knowledge Matching if Gemini fails or is unconfigured
    if not reply_text:
        match = find_best_local_match(user_query)
        if match:
            reply_text = (
                f"**{match['question']}**\n\n"
                f"{match['answer']}\n\n"
                f"*Category: {match.get('category', 'General')}*\n\n"
                f"> **Need more details?** You can contact the **{match.get('category', 'Academic')} Department** or visit the student service portal."
            )
            model_used = "university-knowledge-base"
        else:
            reply_text = (
                "I apologize, but I couldn't find specific official information regarding your query in the current university records.\n\n"
                "### Recommended Next Steps:\n"
                "- Please visit the **Student Support Office** or **Registrar Office**.\n"
                "- You can check the **Campus Directory** tab on this portal to directly email or call the concerned department.\n"
                "- Alternatively, try rephrasing your question or check the **FAQ Knowledge Base** tab."
            )
            model_used = "system-fallback"

    # 6. Generate relevant suggestions
    suggestions = generate_suggested_questions(user_query, reply_text)

    return {
        "reply": reply_text,
        "model": model_used,
        "timestamp": datetime.now().isoformat(),
        "suggestions": suggestions
    }