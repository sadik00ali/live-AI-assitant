import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, 
  Bot, 
  User, 
  Clock, 
  Activity, 
  Stethoscope, 
  Shield, 
  Zap, 
  Target,
  Plus,
  Search,
  X,
  Trash2,
  LogOut,
  Menu,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star
} from 'lucide-react';
import './Chatbot.css';
import API_URL from "./services/api"

const HealthAssistant = () => {
    const [userName, setUserName] = useState("");
    const [patientCategory, setPatientCategory] = useState("");
    const [medicalId, setMedicalId] = useState("");
    const [profileCompleted, setProfileCompleted] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [aiProcessing, setAiProcessing] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState("");
    const [avatarState, setAvatarState] = useState('default');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    // Avatar animation cycle
    useEffect(() => {
        const animationIntervals = setInterval(() => {
            const animations = ['blink', 'nod', 'default'];
            const randomAnim = animations[Math.floor(Math.random() * animations.length)];
            setAvatarState(randomAnim);

            setTimeout(() => setAvatarState('default'), 2000);
        }, 8000);

        return () => clearInterval(animationIntervals);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const verifyMedicalId = async () => {
        try {
            if (!medicalId.trim() || !userName.trim()) {
                setVerificationMessage("Please enter both Medical ID and Name.");
                return { valid: false };
            }

            setVerifying(true);
            setVerificationMessage("");

            // Step 1: Validate patient credentials
            const verificationResponse = await axios.post(`${API_URL}/login`, {
                patientId: medicalId.trim(),
                name: userName.trim()
            });

            if (verificationResponse.data.status !== 'success') {
                return { valid: false, patientInfo: null, error: "Invalid Medical ID or Name." };
            }

            // Step 2: Fetch full patient data
            const patientInfoResponse = await axios.get(`${API_URL}/api/patients/${medicalId.trim()}`);
            const patientInfo = patientInfoResponse.data.patient;

            return { valid: true, patientInfo: patientInfo };

        } catch (error) {
            console.error('Error verifying patient data:', error);
            const errorMsg = error.response?.data?.message || 'Verification service unavailable. Please try again later.';
            setVerificationMessage(errorMsg);
            return { valid: false, patientInfo: null, error: errorMsg };
        } finally {
            setVerifying(false);
        }
    };

    const submitProfile = async () => {
        if (userName.trim() && patientCategory) {
            if (patientCategory === "existing") {
                if (!medicalId.trim()) {
                    setVerificationMessage("Please enter your Medical ID");
                    return;
                }

                const verificationResult = await verifyMedicalId();

                if (!verificationResult.valid) {
                    setVerificationMessage(verificationResult.error || "Invalid Medical ID or Name. Please check and try again.");
                    return;
                }
            }

            setProfileCompleted(true);
            let welcomeText = `Hello ${userName}! `;

            if (patientCategory === "existing") {
                const verificationResult = await verifyMedicalId();
                if (verificationResult.valid && verificationResult.patientInfo) {
                    const patient = verificationResult.patientInfo;
                    welcomeText += `Welcome back to HealthGuard Hospital! I see you're in Ward ${patient.wardNumber} (Cart ${patient.cartNumber}) under ${patient.assignedDoctor.name}. How can I assist you today?`;
                } else {
                    welcomeText += `Welcome back to HealthGuard Hospital! How can I assist you today?`;
                }
            } else {
                welcomeText += "Welcome to HealthGuard Hospital! As a new patient, I'm here to help you get started. How can I assist you today?";
            }

            setConversation([{
                sender: "assistant",
                content: welcomeText,
                timestamp: new Date()
            }]);
        } else {
            setVerificationMessage("Please enter your name and select patient category");
        }
    };

    const sendUserMessage = async () => {
        if (!userInput.trim() || sendingMessage) return;

        const userMsg = { sender: "user", content: userInput, timestamp: new Date() };
        const updatedConversation = [...conversation, userMsg];
        setConversation(updatedConversation);
        setUserInput("");
        setSendingMessage(true);
        setAiProcessing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const requestPayload = {
                message: userInput,
                name: userName,
                patientType: patientCategory,
                patientId: medicalId
            };

            if (patientCategory === "existing") {
                const verificationResult = await verifyMedicalId();
                if (verificationResult.valid && verificationResult.patientInfo) {
                    const patient = verificationResult.patientInfo;
                    requestPayload.ward = patient.wardNumber;
                    requestPayload.room = patient.cartNumber;
                }
            }

            const response = await axios.post(`${API_URL}/chat`, requestPayload);

            setAiProcessing(false);

            setTimeout(() => {
                setConversation([
                    ...updatedConversation,
                    { sender: "assistant", content: response.data.response, timestamp: new Date() }
                ]);
                setSendingMessage(false);
            }, 500);

        } catch (error) {
            setAiProcessing(false);
            setSendingMessage(false);
            setConversation([
                ...updatedConversation,
                { sender: "assistant", content: "Sorry, I'm having trouble connecting to the server. Please try again later.", timestamp: new Date() }
            ]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !sendingMessage && !verifying) {
            if (!profileCompleted) {
                submitProfile();
            } else {
                sendUserMessage();
            }
        }
    };

    const formatTimestamp = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        if (verificationMessage && medicalId) {
            setVerificationMessage("");
        }
    }, [verificationMessage, medicalId]);

    if (!profileCompleted) {
        return (
            <div className="welcome-screen">
                {/* Animated Background Elements */}
                <div className="dynamic-background">
                    <div className="floating-health-icons">
                        <div className="health-symbol"><Stethoscope size={20} /></div>
                        <div className="health-symbol"><Shield size={20} /></div>
                        <div className="health-symbol"><Activity size={20} /></div>
                        <div className="health-symbol"><Bot size={20} /></div>
                        <div className="health-symbol"><CheckCircle2 size={20} /></div>
                        <div className="health-symbol"><Star size={20} /></div>
                    </div>
                    <div className="pulse-circles">
                        <div className="pulse-circle"></div>
                        <div className="pulse-circle"></div>
                        <div className="pulse-circle"></div>
                    </div>
                </div>

                <div className="welcome-content">
                    {/* Animated Medical Avatar */}
                    <div className="medical-avatar-section">
                        <div className="avatar-wrapper">
                            <div className={`digital-avatar ${avatarState}`}>
                                <div className="avatar-visage">
                                    <Bot size={32} />
                                </div>
                                <div className="avatar-aura"></div>
                                <div className="avatar-sparks">
                                    <div className="spark"></div>
                                    <div className="spark"></div>
                                    <div className="spark"></div>
                                </div>
                            </div>
                            <div className="avatar-orbital">
                                <div className="orbital-ring"></div>
                                <div className="orbital-ring"></div>
                                <div className="orbital-ring"></div>
                            </div>
                        </div>

                        <div className="greeting-text">
                            <h1 className="main-title">
                                <span className="title-part">Welcome to</span>
                                <span className="title-part accent">HealthGuard AI</span>
                            </h1>
                            <p className="sub-title">
                                Your intelligent healthcare companion, available 24/7
                            </p>
                        </div>
                    </div>

                    {/* Features Display */}
                    <div className="capabilities-grid">
                        <div className="capability-card" style={{ animationDelay: '0.1s' }}>
                            <div className="capability-icon">
                                <Zap size={24} />
                            </div>
                            <h3>Instant Support</h3>
                            <p>Get immediate answers to your health questions</p>
                        </div>
                        <div className="capability-card" style={{ animationDelay: '0.2s' }}>
                            <div className="capability-icon">
                                <Target size={24} />
                            </div>
                            <h3>Personalized Care</h3>
                            <p>Tailored medical advice based on your needs</p>
                        </div>
                        <div className="capability-card" style={{ animationDelay: '0.3s' }}>
                            <div className="capability-icon">
                                <Shield size={24} />
                            </div>
                            <h3>Secure & Private</h3>
                            <p>DPDP compliant healthcare conversations</p>
                        </div>
                    </div>

                    {/* Statistics Display */}
                    <div className="metrics-container">
                        <div className="metric-item">
                            <div className="metric-value">10K+</div>
                            <div className="metric-description">Patients Served</div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-value">24/7</div>
                            <div className="metric-description">Available</div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-value">99.9%</div>
                            <div className="metric-description">Accuracy</div>
                        </div>
                    </div>

                    {/* Patient Registration Form */}
                    <div className="registration-container">
                        <div className="form-heading">
                            <h2>Let's Get Started</h2>
                            <p>Join thousands of patients who trust our AI healthcare system</p>
                        </div>

                        <div className="registration-form">
                            <div className="input-group">
                                <label className="input-label">Full Name *</label>
                                <input
                                    className="name-field"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Enter your full name"
                                    onKeyDown={handleKeyPress}
                                    autoFocus
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Are you a new or existing patient? *</label>
                                <div className="category-buttons">
                                    <button
                                        type="button"
                                        className={`category-btn ${patientCategory === 'new' ? 'selected' : ''}`}
                                        onClick={() => setPatientCategory('new')}
                                    >
                                        <span className="button-icon">
                                            <User size={16} />
                                        </span>
                                        New Patient
                                    </button>
                                    <button
                                        type="button"
                                        className={`category-btn ${patientCategory === 'existing' ? 'selected' : ''}`}
                                        onClick={() => setPatientCategory('existing')}
                                    >
                                        <span className="button-icon">
                                            <CheckCircle2 size={16} />
                                        </span>
                                        Existing Patient
                                    </button>
                                </div>
                            </div>

                            {patientCategory === 'existing' && (
                                <div className="input-group">
                                    <label className="input-label">Medical ID *</label>
                                    <input
                                        className={`medical-id-field ${verificationMessage ? 'invalid' : ''}`}
                                        value={medicalId}
                                        onChange={(e) => setMedicalId(e.target.value)}
                                        placeholder="Enter your medical ID (e.g., P-68a61522)"
                                        onKeyDown={handleKeyPress}
                                        disabled={verifying}
                                    />
                                    {verifying && (
                                        <div className="verification-loading">
                                            <div className="loading-indicators">
                                                <div className="indicator"></div>
                                                <div className="indicator"></div>
                                                <div className="indicator"></div>
                                            </div>
                                            Verifying Medical ID...
                                        </div>
                                    )}
                                    {verificationMessage && (
                                        <div className="verification-error">
                                            <X size={16} />
                                            {verificationMessage}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                className="begin-journey-btn"
                                onClick={submitProfile}
                                disabled={verifying || !userName.trim() || !patientCategory}
                            >
                                {verifying ? (
                                    <div className="button-loading">
                                        <div className="loading-rotation"></div>
                                        Verifying...
                                    </div>
                                ) : (
                                    <>
                                        <span className="button-sparkle">
                                            <Sparkles size={16} />
                                        </span>
                                        Start Healthcare Journey
                                        <span className="button-arrow">
                                            <ArrowRight size={16} />
                                        </span>
                                    </>
                                )}
                            </button>

                            <div className="assurance-badges">
                                <div className="assurance-badge">
                                    <Shield size={14} />
                                    DPDP Compliant
                                </div>
                                <div className="assurance-badge">
                                    <Star size={14} />
                                    4.9/5 Rating
                                </div>
                                <div className="assurance-badge">
                                    <Stethoscope size={14} />
                                    Doctor Approved
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Animated Wave Bottom */}
                <div className="welcome-wave">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor"></path>
                        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor"></path>
                        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor"></path>
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="assistant-interface">
            <div className="assistant-header">
                <div className="header-icon">
                    <Bot size={20} />
                </div>
                <h2 className="header-title">
                    HealthGuard Assistant - {userName} 
                    {medicalId && <span className="medical-id">(ID: {medicalId})</span>}
                </h2>
                <div className="status-indicator">
                    <div className="status-dot"></div>
                    <span className="status-text">Online</span>
                </div>
            </div>

            <div className="conversation-panel">
                {conversation.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.sender}`}>
                        <div className="message-content">
                            <div className="message-body">
                                {msg.content}
                            </div>
                            <div className="message-time">
                                <Clock size={12} />
                                <span>{formatTimestamp(msg.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {aiProcessing && (
                    <div className="processing-indicator">
                        <div className="processing-animation">
                            <Activity className="pulse-icon" />
                        </div>
                        <span className="processing-text">
                            AI Assistant is analyzing your query...
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} className="scroll-marker" />
            </div>

            <div className="input-section">
                <input
                    className="message-input"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Describe your symptoms or ask a health question..."
                    disabled={sendingMessage}
                />
                <button
                    className={`send-button ${sendingMessage ? 'processing' : ''}`}
                    onClick={sendUserMessage}
                    disabled={sendingMessage || !userInput.trim()}
                >
                    {sendingMessage ? (
                        <div className="send-loader"></div>
                    ) : (
                        <Send size={18} className="send-icon" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default HealthAssistant;