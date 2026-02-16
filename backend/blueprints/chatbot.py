import os
from flask import Flask, request, jsonify, send_from_directory,Blueprint
from flask_cors import CORS
import difflib
import ollama
from pymongo import MongoClient
from bson.objectid import ObjectId
from collections import defaultdict, deque
import datetime
from deep_translator import GoogleTranslator






# Set the OLLAMA_HOST environment variable
# This ensures a consistent connection, even if the default changes or is blocked.

chatbot_db = Blueprint("chatbot_db", __name__)
CORS(chatbot_db)

chat_history = defaultdict(list)
os.environ['OLLAMA_HOST'] = 'http://127.0.0.1:11434'
# ---------------- MongoDB Setup ----------------
try:
    client = MongoClient("mongodb://localhost:27017/")
    client.server_info()  # Check if the connection is successful
    db = client["hospital_db"]
    patients_col = db["patients"]
    staff_col = db["staff"]
    wards_col = db["wards"]
    chat_col = db["chat_history"]  # Make sure this collection exists
    
    print("Successfully connected to MongoDB.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    # You might want to handle this more gracefully, e.g., by exiting
    # or returning an error message to the frontend.

chat_history = defaultdict(lambda: deque(maxlen=3))

def store_chat_in_db(patient_id, user_message, bot_response):
    """Stores the user query and bot response in MongoDB."""
    try:
        doc = {
            "patientId": patient_id,
            "user_message": user_message,
            "bot_response": bot_response,
            "timestamp": datetime.datetime.utcnow()
        }
        chat_col.insert_one(doc)
        print(f"Chat stored for patient {patient_id}")
    except Exception as e:
        print(f"Error storing chat in DB: {e}")

# ---------------- Enhanced FAQ Map ----------------
faq_map = {
    "what are the visiting hours": "Visiting hours are from 4 PM to 7 PM daily. Only 2 visitors per patient are allowed.",
    "do you accept insurance": "Yes, we accept most major insurance providers including ABC Insurance, XYZ Health, and Global Care.",
    "how can i book an appointment": "You can book an appointment:\n• Online through our patient portal\n• By calling reception at +91-9876543211\n• In-person at reception desk",
    "what is the emergency contact number": "For emergencies, call our 24/7 emergency hotline: +91-9876543210",
    "where is the hospital located": "We are located at: 123 Health Care Avenue, Medical District, City - 560001",
    "what are your operation timings": "Our timings:\n• OPD: 9:00 AM - 6:00 PM\n• Emergency: 24/7\n• Pharmacy: 8:00 AM - 10:00 PM",
}

def match_faq(user_input: str):
    """Enhanced FAQ matching with fuzzy matching."""
    query = user_input.lower()
    
    # Direct match
    for q, ans in faq_map.items():
        if q in query:
            return ans
    
    # Keyword matching for better coverage
    if any(word in query for word in ["visit", "visiting", "hours", "time"]):
        return faq_map["what are the visiting hours"]
    elif any(word in query for word in ["insurance", "claim", "coverage"]):
        return faq_map["do you accept insurance"]
    elif any(word in query for word in ["appointment", "book", "schedule"]):
        return faq_map["how can i book an appointment"]
    elif any(word in query for word in ["emergency", "urgent", "critical"]):
        return faq_map["what is the emergency contact number"]
    elif any(word in query for word in ["location", "address", "where"]):
        return faq_map["where is the hospital located"]
    elif any(word in query for word in ["timing", "open", "close", "hour"]):
        return faq_map["what are your operation timings"]
    
    return None

# ---------------- Enhanced Symptom Matcher ----------------
symptom_map = {
    "fever headache body pain": "You may have viral fever. Please consult a physician. Rest and stay hydrated.",
    "cough cold sore throat": "These appear to be cold symptoms. Stay hydrated and consider steam inhalation.",
    "chest pain breathlessness": "🚨 These could be serious symptoms. Please visit emergency immediately.",
    "stomach pain nausea vomiting": "These could indicate gastritis or food poisoning. Consult a doctor.",
    "headache dizziness": "These symptoms need medical evaluation. Please consult a physician.",
}

def match_symptoms(user_input: str):
    """Enhanced symptom matching with better logic."""
    user_input = user_input.lower()
    user_words = set(user_input.split())
    
    best_match = None
    highest_matches = 0
    
    for symptoms, info in symptom_map.items():
        symptom_keywords = symptoms.split()
        matches = 0
        
        for word in symptom_keywords:
            if word in user_words:
                matches += 1
            else:
                close = difflib.get_close_matches(word, user_words, cutoff=0.7)
                if close:
                    matches += 1
        
        if matches > highest_matches and matches >= 2:
            highest_matches = matches
            best_match = info
    
    return best_match

# ---------------- Helper Functions ----------------
def latest_prescription_line(patient):
    prescriptions = patient.get("prescriptions", [])
    if prescriptions:
        latest = prescriptions[-1]
        return f"Your latest prescription (dated {latest.get('date','N/A')}): {', '.join(latest.get('medicines', []))}."
    return "No prescriptions found in your record."

def next_appointment_line(patient):
    appointments = patient.get("appointments", [])
    if appointments:
        upcoming = appointments[-1]
        return f"Your next appointment is on {upcoming.get('date','N/A')} with Dr. {upcoming.get('doctor','Unknown')}."
    return "No upcoming appointments in your record."

def build_ollama_prompt(user_message, patient=None, user_id=None, staff_list=None):
    context = (
        "You are HealthCare AI, a helpful hospital assistant at City General Hospital. "
        "You can only answer questions related to healthcare, hospital services, appointments, symptoms, "
        "doctors, medications, and medical reports. "
        "If the user asks about anything outside of this domain, politely respond that you are only trained to help with hospital and medical-related queries.\n\n"
    )
    
    # Include staff info if available
    if staff_list:
        context += "Hospital Staff:\n"
        for staff_member in staff_list:
            context += f"- {staff_member}\n"
        context += "\n"

    if patient:
        context += f"Patient Name: {patient.get('name', 'N/A')}\n"
        context += f"Age: {patient.get('age', 'N/A')}\n"
        context += f"Gender: {patient.get('gender', 'N/A')}\n"

        user_msg_lower = user_message.lower()

        if "lab" in user_msg_lower or "test" in user_msg_lower:
            if patient.get("labReports"):
                latest_lab = patient["labReports"][-1]
                context += f"Lab Report: {latest_lab.get('testName')} on {latest_lab.get('date')}: {latest_lab.get('results')}\n"

        if "medicine" in user_msg_lower or "prescription" in user_msg_lower:
            if patient.get("prescriptions"):
                latest = patient["prescriptions"][-1]
                meds = ', '.join([f"{m['name']} ({m['dosage']})" for m in latest.get("medicines", [])])
                context += f"Latest Prescription: {meds} (Date: {latest.get('date')})\n"

        if "appointment" in user_msg_lower or "visit" in user_msg_lower:
            if patient.get("appointments"):
                next_app = patient["appointments"][-1]
                context += f"Next Appointment: {next_app.get('description')} on {next_app.get('date')}\n"

    # Add recent chat history for context if available (last 3 Q&A)
    if user_id and user_id in chat_history and chat_history[user_id]:
        context += "\nRecent conversation history:\n"
        for q, a in chat_history[user_id]:
            context += f"User: {q}\nAssistant: {a}\n"
        context += "\n"

    context += f"User query: {user_message}\n\nAssistant:"
    return context

import requests

def ollama_reply_or_fallback(prompt):
    """Connect directly to local Ollama API (llama3:latest) with error fallback."""
    try:
        OLLAMA_API = "http://127.0.0.1:11434/api/generate"
        payload = {
            "model": "llama3:latest",
            "prompt": prompt,
            "stream": False
        }

        response = requests.post(OLLAMA_API, json=payload, timeout=120)
        data = response.json()

        # Ollama’s response contains the AI output in 'response'
        if "response" in data:
            print("✅ Ollama response generated successfully")
            return data["response"]
        else:
            print(f"Unexpected Ollama response: {data}")
            return "Sorry, I couldn’t generate a response."

    except Exception as e:
        print(f"Ollama error: {e}")

        # Graceful fallback replies
        prompt_lower = prompt.lower()
        if "appointment" in prompt_lower:
            return "To book an appointment, please call our reception at +91-9876543211."
        elif "emergency" in prompt_lower:
            return "For emergencies, please go to the emergency department immediately or call +91-9876543210."
        elif "prescription" in prompt_lower:
            return "For prescription queries, please contact your doctor or pharmacy."
        else:
            return "I'm here to help with hospital services and medical information. How can I assist you today?"

# ---------------- Medical Disclaimer with Tagline ----------------
MEDICAL_DISCLAIMER = """
---

**Your HealthGuard AI Companion - Personalized Medical Guidance at Your Fingertips**

*Note:* This assistant provides general information only and does not replace a doctor's advice.
"""

# ---------------- Login Route ----------------
@chatbot_db.route("/login", methods=["POST"])
def login():
    data = request.json
    patientId = str(data.get("patientId", "")).strip()
    name = str(data.get("name", "")).strip()
    patient_type = str(data.get("patientType", "existing")).strip().lower()

    if patient_type == "existing" and (not patientId or not name):
        return jsonify({
            "status": "fail",
            "message": "Both Patient ID and Name are required for existing patients."
        }), 400

    if patient_type == "new":
        return jsonify({
            "status": "success",
            "role": "patient",
            "message": "Welcome! As a new patient, you can ask about our services and doctors."
        }), 200

    try:
        user = patients_col.find_one({
            "patientId": {"$regex": f"^{patientId}$", "$options": "i"},
            "name": {"$regex": f"^{name}$", "$options": "i"}
        })

        if user:
            return jsonify({
                "status": "success",
                "role": "patient",
                "message": f"Welcome {user['name']}, you have successfully logged in."
            }), 200
        else:
            return jsonify({
                "status": "fail",
                "message": "Invalid Patient ID or Name."
            }), 404

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            "status": "fail",
            "message": f"Server error: {e}"
        }), 500

# ---------------- Chat Route ----------------
@chatbot_db.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True) or {}
        user_message = (data.get("message") or "").strip()

        # Handle patient ID
        raw_patient_id = data.get("patientId")
        if isinstance(raw_patient_id, list):
            patient_id = str(raw_patient_id[0]).strip() if raw_patient_id else ""
        else:
            patient_id = str(raw_patient_id or "").strip()

        patient_type = (data.get("patientType") or "existing").strip().lower()

        if not user_message:
            return jsonify({"response": "Please type a message to continue."}), 400

        # 🌍 Detect and translate user input (auto language handling)
        user_lang = "en"
        try:
            translated_user_msg = GoogleTranslator(source='auto', target='en').translate(user_message)
            # Detect input language automatically
            detector = GoogleTranslator(source='auto', target='en')
            detected_text = detector.translate(user_message)
            if detected_text != user_message:
                # If translation changed, assume it's not English
                user_lang = "ta" if any(u'\u0B80' <= ch <= u'\u0BFF' for ch in user_message) else "auto"
            print(f"Detected language: {user_lang}")
            print(f"Translated to English: {translated_user_msg}")
        except Exception as e:
            print(f"Translation error (user -> en): {e}")
            translated_user_msg = user_message
            user_lang = "en"

        # 🏥 Fetch patient data if existing
        patient = None
        if patient_type == "existing" and patient_id:
            pipeline = [
                {'$match': {'patientId': patient_id}},
                {'$lookup': {
                    'from': 'staff',
                    'localField': 'assignedDoctor',
                    'foreignField': '_id',
                    'as': 'assignedDoctor'
                }},
                {'$lookup': {
                    'from': 'wards',
                    'localField': 'wardNumber',
                    'foreignField': 'name',
                    'as': 'wardDetails'
                }}
            ]
            result = list(patients_col.aggregate(pipeline))
            if result:
                patient = result[0]

        # 👩‍⚕️ Fetch hospital staff list
        staff_list = []
        try:
            staff_docs = list(staff_col.find({}, {'name': 1, 'specialization': 1, '_id': 0}))
            staff_list = [f"{s['name']} ({s.get('specialization', 'N/A')})" for s in staff_docs]
        except Exception as e:
            print(f"Error fetching staff: {e}")

        # 💬 Step 1: Check FAQs
        faq_answer = match_faq(translated_user_msg)
        if faq_answer:
            response_text = faq_answer + MEDICAL_DISCLAIMER
        else:
            # 💬 Step 2: Check Symptom Matches
            symptom_answer = match_symptoms(translated_user_msg)
            if symptom_answer:
                response_text = symptom_answer + MEDICAL_DISCLAIMER
            else:
                # 💬 Step 3: Use Ollama (llama3:latest)
                prompt = build_ollama_prompt(translated_user_msg, patient, patient_id, staff_list)
                reply = ollama_reply_or_fallback(prompt)
                response_text = reply + MEDICAL_DISCLAIMER

        # 🌍 Translate bot response back to user's detected language
        try:
            if user_lang != "en":
                translated_response = GoogleTranslator(source='en', target=user_lang).translate(response_text)
            else:
                translated_response = response_text
        except Exception as e:
            print(f"Translation error (en -> user_lang): {e}")
            translated_response = response_text

        # 💾 Store chat in DB + memory
        if patient_id:
            chat_history[patient_id].append((user_message, translated_response))
            store_chat_in_db(patient_id, user_message, translated_response)

        return jsonify({
            "response": translated_response,
            "translated_from": "en",
            "lang": user_lang
        })

    except Exception as e:
        print(f"Chat route error: {e}")
        error_response = f"Sorry, something went wrong: {e}" + MEDICAL_DISCLAIMER
        return jsonify({"response": error_response}), 500

# ---------------- Chat History Search Route ----------------
@chatbot_db.route("/api/chat/search", methods=["GET"])
def search_chat():
    keyword = request.args.get("q", "").strip()
    patient_id = request.args.get("patientId", "").strip()
    
    if not patient_id:
        return jsonify({"success": False, "message": "Patient ID is required."}), 400

    try:
        query_filter = {"patientId": patient_id}
        if keyword:
            query_filter["user_message"] = {"$regex": keyword, "$options": "i"}

        results = list(chat_col.find(query_filter).sort("timestamp", -1).limit(50))
        for r in results:
            r["_id"] = str(r["_id"])
            r["timestamp"] = r["timestamp"].isoformat() if hasattr(r["timestamp"], 'isoformat') else r["timestamp"]

        return jsonify({"success": True, "results": results}), 200
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({"success": False, "message": f"Search error: {e}"}), 500

# ---------------- Patient Data Route ----------------
def convert_objectids(doc):
    """Recursively converts all ObjectId instances in a dict/list to strings."""
    if isinstance(doc, dict):
        return {k: convert_objectids(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [convert_objectids(i) for i in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc

@chatbot_db.route("/api/patients/<patientId>")
def get_patient_data(patientId):
    try:
        pipeline = [
            {'$match': {'patientId': patientId}},
            {'$lookup': {
                'from': 'staff',
                'localField': 'assignedDoctor',
                'foreignField': '_id',
                'as': 'assignedDoctor'
            }},
            {'$lookup': {
                'from': 'wards',
                'localField': 'wardNumber',
                'foreignField': 'name',
                'as': 'wardDetails'
            }}
        ]
        result = list(patients_col.aggregate(pipeline))
        
        if result:
            patient = convert_objectids(result[0])

            if 'assignedDoctor' in patient and patient['assignedDoctor']:
                patient['assignedDoctor'] = patient['assignedDoctor'][0]
            else:
                patient['assignedDoctor'] = {'name': 'Unknown'}

            if 'wardDetails' in patient and patient['wardDetails']:
                patient['wardDetails'] = patient['wardDetails'][0]
            else:
                patient['wardDetails'] = {'name': 'Unknown'}

            return jsonify({"success": True, "patient": patient}), 200
        else:
            return jsonify({"success": False, "message": "Patient not found"}), 404
    except Exception as e:
        print(f"Get patient data route error: {e}")
        return jsonify({"success": False, "message": f"Server error: {e}"}), 500

# ---------------- Staff Data Route ----------------
@chatbot_db.route("/api/staff")
def get_all_staff():
    try:
        staff_list = list(staff_col.find({}, {'_id': 1, 'name': 1, 'specialization': 1, 'role': 1}))
        for s in staff_list:
            s['_id'] = str(s['_id'])
        return jsonify({"success": True, "staff": staff_list}), 200
    except Exception as e:
        print(f"Get all staff route error: {e}")
        return jsonify({"success": False, "message": f"Server error: {e}"}), 500

# ---------------- Health Check Route ----------------
@chatbot_db.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "services": {
            "mongodb": "connected" if patients_col else "disconnected",
            "ollama": "checking"
        },
        "tagline": "Your HealthGuard AI Companion - Personalized Medical Guidance at Your Fingertips"
    }), 200

# ---------------- Run Server ----------------
# if __name__ == "__main__":
#     from flask import Flask
#     app = Flask(__name__)
#     app.register_blueprint(chatbot_db)
#     CORS(app)
#     print("🚀 Hospital Chatbot Server starting on http://localhost:5000")
#     print("🏥 Your HealthGuard AI Companion - Personalized Medical Guidance at Your Fingertips")
#     app.run(debug=True, port=5000)