import streamlit as st
import os
import base64
from pypdf import PdfReader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

# --- CONFIGURATION ---
st.set_page_config(page_title="Live AI Auditor", page_icon="🔍", layout="wide")
st.title("🔍 Live AI Assistant: PDF Claim Verifier & Source Citation Node")
st.subheader("Upload a document, search facts real-time via voice, and extract web sources instantly")

# Sidebar for API Keys
with st.sidebar:
    st.header("🔑 API Configurations")
    gemini_api_key = st.text_input("Gemini API Key", type="password")
    tavily_api_key = st.text_input("Tavily API Key", type="password")
    st.info("💡 Pro Tip: Gemini keys are free from Google AI Studio!")

if not gemini_api_key or not tavily_api_key:
    st.warning("Please enter both Gemini and Tavily API keys in the sidebar to run the project.")
    st.stop()

# --- AUDIO PLAYBACK FUNCTION (TEXT TO SPEECH GENERATION) ---
def play_voice_output(text_to_speak):
    try:
        from gtts import gTTS
        tts = gTTS(text=text_to_speak, lang='en', slow=False)
        tts.save("reply.mp3")
        
        with open("reply.mp3", "rb") as f:
            audio_bytes = f.read()
        audio_base64 = base64.b64encode(audio_bytes).decode()
        audio_html = f"""
            <audio autoplay style="display:none;">
                <source src="data:audio/mp3;base64,{audio_base64}" type="audio/mp3">
            </audio>
        """
        st.components.v1.html(audio_html, height=0)
    except Exception as e:
        pass

# --- FILE UPLOADER FEATURE ---
uploaded_file = st.file_uploader("📂 Upload a PDF document for analysis", type=["pdf"])
document_context = ""

if uploaded_file is not None:
    with st.spinner("Parsing PDF content..."):
        try:
            pdf_reader = PdfReader(uploaded_file)
            parsed_text = ""
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    parsed_text += text + "\n"
            
            if parsed_text.strip():
                document_context = parsed_text
                st.success(f"Successfully processed: '{uploaded_file.name}' ({len(pdf_reader.pages)} pages loaded!)")
            else:
                st.error("Could not extract text from this PDF.")
        except Exception as e:
            st.error(f"Error reading PDF: {e}")

# --- 🎙️ JAVASCRIPT LIVE VOICE ASSISTANT INJECTOR ---
st.write("### 🎙️ Voice Assistant Control")

st.components.v1.html("""
    <div style="background-color: #1e1e24; padding: 15px; border-radius: 10px; display: flex; align-items: center; gap: 15px; border: 1px solid #3a3a42;">
        <button id="start-record-btn" style="background-color: #ff4b4b; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s;">
            🎤 Tap to Speak
        </button>
        <p id="recording-status" style="color: #a3a3a3; margin: 0; font-family: sans-serif; font-size: 14px;">Microphone is idle. Click to start talking...</p>
    </div>

    <script>
        const recordBtn = document.getElementById('start-record-btn');
        const statusText = document.getElementById('recording-status');

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recordBtn.addEventListener('click', () => {
                recognition.start();
                recordBtn.style.backgroundColor = '#d32f2f';
                recordBtn.innerText = '🛑 Listening...';
                statusText.innerText = 'AI is listening to your voice. Start speaking now!';
            });

            recognition.onresult = (event) => {
                const speechToTextResult = event.results.transcript;
                recordBtn.style.backgroundColor = '#4caf50';
                recordBtn.innerText = '✅ Captured!';
                statusText.innerText = 'Speech Found: "' + speechToTextResult + '"';
                
                parent.postMessage({
                    type: 'streamlit:set_widget_value',
                    value: speechToTextResult,
                    is_chat_input: true
                }, '*');
                
                setTimeout(() => {
                    recordBtn.style.backgroundColor = '#ff4b4b';
                    recordBtn.innerText = '🎤 Tap to Speak';
                    statusText.innerText = 'Click again to ask another question.';
                }, 3000);
            };

            recognition.onerror = (event) => {
                recordBtn.style.backgroundColor = '#ff4b4b';
                recordBtn.innerText = '🎤 Try Again';
                statusText.innerText = 'Error occurred during capture: ' + event.error;
            };
        } else {
            statusText.innerText = "Critical Warning: Voice Recognition web modules are not supported in this browser.";
            recordBtn.disabled = true;
        }
    </script>
""", height=100)

# --- 1. DEFINE WEB TOOLS ---
search_tool = TavilySearchResults(max_results=3, tavily_api_key=tavily_api_key)
tools = [search_tool]

# --- 2. INITIALIZE GEMINI BRAIN & AGENT LOOP ---
memory = MemorySaver()
model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    google_api_key=gemini_api_key,
    temperature=0.2
)
agent_executor = create_react_agent(model, tools, checkpointer=memory)

# --- 3. UI CHAT LOGIC ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history along with previously fetched citations mapping
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "citations" in message and message["citations"]:
            st.write("🛍️ **Verified Web Sources used:**")
            cols = st.columns(len(message["citations"]))
            for idx, src in enumerate(message["citations"]):
                with cols[idx]:
                    st.info(f"**[{idx+1}] {src['title'][:30]}...**\n\n🔗 [Visit Source Website]({src['url']})")

# Handle User Prompt
if prompt := st.chat_input("Ask me to analyze or fact-check something..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        config = {"configurable": {"thread_id": "advanced_citation_agent"}}
        
        system_instruction = (
            "You are an expert Fact-Checking AI Agent. "
            "You MUST use the search tool to verify time-sensitive data, news, prices, or claims. "
            "Keep your final answer precise and under 3 short sentences so it sounds natural when spoken aloud."
        )
        
        if document_context:
            system_instruction += (
                f"\n\n[DOCUMENT CONTEXT]: The user has uploaded a document. Here is its content:\n{document_context}\n"
                "When answering questions, prioritize verifying if the claims inside this document match the latest data on the web."
            )

        inputs = {"messages": [("system", system_instruction), ("human", prompt)]}

        full_response = ""
        extracted_sources = []
        
        # Stream evaluation nodes graph execution pipeline tracker
        for event in agent_executor.stream(inputs, config=config, stream_mode="values"):
            steps_history = event["messages"]
            latest_msg = steps_history[-1]
            
            # Extract underlying data maps from tools node executions step history pipeline
            if len(steps_history) > 1:
                prior_msg = steps_history[-2]
                # Look for tool calling data models context arrays
                if hasattr(prior_msg, 'tool_calls') and prior_msg.tool_calls:
                    if latest_msg.type == "tool" and latest_msg.name == "tavily_search_results_json":
                        try:
                            # Safely eval tool result payload strings to parse reference links metrics
                            import json
                            raw_results = json.loads(latest_msg.content)
                            if isinstance(raw_results, list):
                                for item in raw_results:
                                    if {"url": item.get("url"), "title": item.get("title")} not in extracted_sources:
                                        extracted_sources.append({
                                            "url": item.get("url"),
                                            "title": item.get("title", "Verified Web Document Reference Link Reference")
                                        })
                        except Exception:
                            pass
            
            if latest_msg.type == "ai":
                full_response = latest_msg.content
                message_placeholder.markdown(full_response + " ▌")
        
        message_placeholder.markdown(full_response)
        
        # Render clean Visual Layout Cards (📑 List & Card Layout Anchor Patterns)
        if extracted_sources:
            st.write("🛍️ **Verified Web Sources used:**")
            cols = st.columns(len(extracted_sources))
            for idx, src in enumerate(extracted_sources):
                with cols[idx]:
                    st.info(f"**[{idx+1}] {src['title'][:30]}...**\n\n🔗 [Visit Source Website]({src['url']})")
        
        play_voice_output(full_response)
    
