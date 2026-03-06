import React, { useEffect, useState } from "react";
import { AlertTriangle, X, Clock, MapPin, User, Bell } from "lucide-react";
import "./alerts.styles.css";

const AlertModal = ({ alertData, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // ✅ Hooks must always run first
  useEffect(() => {
    if (alertData) {
      setTimeout(() => setIsVisible(true), 10);
    }
  }, [alertData]);

  // ✅ Now safe to conditionally return
  if (!alertData) return null;

  const formattedTime = new Date(alertData.timestamp).toLocaleString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );

  const handleClose = () => {
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className={`alert-overlay ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
      <div className="alert-modal">
        {/* Animated background pulse */}
        <div className="alert-pulse-bg"></div>
        
        {/* Emergency ribbon */}
        <div className="alert-ribbon">
          <Bell size={16} />
          <span>URGENT</span>
        </div>

        <div className="alert-header">
          <div className="alert-icon-wrapper">
            <AlertTriangle size={32} className="alert-icon" />
          </div>
          <h2>Emergency Alert</h2>
          <button className="alert-close-btn" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="alert-body">
          <div className="alert-field">
            <div className="field-icon">
              <User size={18} />
            </div>
            <div className="field-content">
              <span className="field-label">Patient</span>
              <span className="field-value">{alertData.patient_name}</span>
            </div>
          </div>

          <div className="alert-field message-field">
            <div className="field-icon">
              <Bell size={18} />
            </div>
            <div className="field-content">
              <span className="field-label">Message</span>
              <span className="field-value message-text">{alertData.message}</span>
            </div>
          </div>

          <div className="alert-grid">
            <div className="alert-field">
              <div className="field-icon">
                <MapPin size={18} />
              </div>
              <div className="field-content">
                <span className="field-label">Ward</span>
                <span className="field-value badge">General Ward 2</span>
              </div>
            </div>

            <div className="alert-field">
              <div className="field-icon">
                <MapPin size={18} />
              </div>
              <div className="field-content">
                <span className="field-label">Cart</span>
                <span className="field-value badge">Station 3</span>
              </div>
            </div>
          </div>

          <div className="alert-field">
            <div className="field-icon">
              <Clock size={18} />
            </div>
            <div className="field-content">
              <span className="field-label">Time</span>
              <span className="field-value">{formattedTime}</span>
            </div>
          </div>
        </div>

        <div className="alert-footer">
          <button className="alert-acknowledge-btn" onClick={handleClose}>
            <span className="btn-text">Acknowledge</span>
            <span className="btn-shortcut">↵</span>
          </button>
          <button className="alert-snooze-btn" onClick={handleClose}>
            Snooze (5 min)
          </button>
        </div>
      </div>
    </div>
  );
};


export default AlertModal;