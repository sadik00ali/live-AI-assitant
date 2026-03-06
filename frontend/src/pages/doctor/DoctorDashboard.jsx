import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  User, 
  Calendar, 
  FileText, 
  Pill, 
  Stethoscope,
  Activity,
  Phone,
  Bell,
  Settings
} from "lucide-react";
import "./DoctorDashboard.css";
import API_URL from "../../services/api";

// Import tab components
import DoctorProfile from "../../components/doctor/DoctorProfile";
import Appointments from "../../components/doctor/Appointments.jsx";
import PatientReports from "../../components/doctor/PatientReports";
import AddPrescription from "../../components/doctor/Prescriptions.jsx";
import FetusPredictor from "../../components/doctor/PredictForm.jsx";
import FetalSegmentation from "../../components/doctor/FetalSegmentation.jsx";
// 
import useDoctorAlerts from "../../components/reusable/useDoctorAlerts.jsx";


function DoctorDashboard() {
  const [physician, setPhysician] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] = useState("profile");
  const [notificationCount, setNotificationCount] = useState(3);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const physicianId = localStorage.getItem("userId");
  
  const AlertPopup = useDoctorAlerts();
  useEffect(() => {
    if (!physicianId) {
      setErrorMessage("Physician ID not found. Please login again.");
      setIsLoading(false);
      return;
    }

    const fetchPhysicianData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/staff/${physicianId}`
        );
        setPhysician(response.data);
      } catch (err) {
        console.error(err);
        setErrorMessage("Unable to load physician information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhysicianData();
  }, [physicianId]);

  const updateAvailabilityStatus = async () => {
    if (!physician) return;

    const newStatus = physician.status === "active" ? "inactive" : "active";

    try {
      await axios.put(
        `${API_URL}/api/staff/${physicianId}/status`,
        { status: newStatus },
        { headers: { "Content-Type": "application/json" } }
      );

      setPhysician((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Status update failed", err);
      alert("Unable to update availability status");
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (isLoading) {
    return (
      <div className="phys_portal_loading">
        <div className="phys_portal_spinner"></div>
        <p>Loading physician portal...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="phys_portal_error">
        <Activity size={24} />
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (!physician) {
    return (
      <div className="phys_portal_error">
        <User size={24} />
        <p>No physician data available</p>
      </div>
    );
  }

  return (
    <div className="phys_portal_container">
      {/* Header Section */}
      {AlertPopup}
      <header className="phys_portal_header">
        <div className="phys_portal_header_content">
          <div className="phys_portal_welcome">
            <h1>Welcome, Dr. {physician.name}</h1>
            <p className="phys_portal_greeting">Your medical practice dashboard</p>
          </div>
          
          <div className="phys_portal_header_controls">
            {/* Mobile Menu Toggle */}
            <button 
              className="phys_portal_mobile_toggle"
              onClick={toggleMobileMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div className="phys_portal_status_control">
              <span className={`phys_portal_status_indicator ${physician.status}`}>
                <span className="phys_portal_status_dot"></span>
                {physician.status === "active" ? "Available" : "Unavailable"}
              </span>
              <label className="phys_portal_toggle">
                <input
                  type="checkbox"
                  checked={physician.status === "active"}
                  onChange={updateAvailabilityStatus}
                />
                <span className="phys_portal_toggle_slider"></span>
              </label>
            </div>
            
            <div className="phys_portal_notifications">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="phys_portal_notification_badge">
                  {notificationCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="phys_portal_content">
        {/* Navigation Sidebar */}
        <nav className={`phys_portal_sidebar ${isMobileMenuOpen ? 'phys_portal_sidebar_open' : ''}`}>
          <div className="phys_portal_sidebar_header">
            <div className="phys_portal_avatar">
              {physician.name ? physician.name.charAt(0).toUpperCase() : 'D'}
            </div>
            <div className="phys_portal_user_info">
              <h3>Dr. {physician.name}</h3>
              <p>{physician.specialization}</p>
              <p className="phys_portal_department">{physician.department}</p>
            </div>
            <button 
              className="phys_portal_sidebar_close"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="phys_portal_navigation">
            <button 
              className={`phys_portal_nav_item ${activeSection === "profile" ? "phys_portal_nav_active" : ""}`}
              onClick={() => handleSectionChange("profile")}
            >
              <User className="phys_portal_nav_icon" size={20} />
              <span className="phys_portal_nav_text">Profile</span>
            </button>
            
            <button 
              className={`phys_portal_nav_item ${activeSection === "appointments" ? "phys_portal_nav_active" : ""}`}
              onClick={() => handleSectionChange("appointments")}
            >
              <Calendar className="phys_portal_nav_icon" size={20} />
              <span className="phys_portal_nav_text">Appointments</span>
              <span className="phys_portal_nav_count">5</span>
            </button>
            
            <button 
              className={`phys_portal_nav_item ${activeSection === "patientReports" ? "phys_portal_nav_active" : ""}`}
              onClick={() => handleSectionChange("patientReports")}
            >
              <FileText className="phys_portal_nav_icon" size={20} />
              <span className="phys_portal_nav_text">Patient Reports</span>
            </button>
            
            <button 
              className={`phys_portal_nav_item ${activeSection === "addPrescription" ? "phys_portal_nav_active" : ""}`}
              onClick={() => handleSectionChange("addPrescription")}
            >
              <Pill className="phys_portal_nav_icon" size={20} />
              <span className="phys_portal_nav_text">Prescriptions</span>
            </button>
            
            <button 
              className={`phys_portal_nav_item ${activeSection === "predictform" ? "phys_portal_nav_active" : ""}`}
              onClick={() => handleSectionChange("predictform")}
            >
              <Stethoscope className="phys_portal_nav_icon" size={20} />
              <span className="phys_portal_nav_text">Fetal Screening</span>
            </button>

           
          </div>

          <div className="phys_portal_sidebar_footer">
            <div className="phys_portal_emergency">
              <Phone size={16} />
              <div>
                <p>Emergency Contact</p>
                <strong>+1 (555) 123-HELP</strong>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="phys_portal_main">
          <div className="phys_portal_main_content">
            {activeSection === "profile" && <DoctorProfile doctor={physician} />}
            {activeSection === "appointments" && <Appointments doctorId={physicianId} />}
            {activeSection === "patientReports" && <PatientReports doctorId={physicianId} />}
            {activeSection === "addPrescription" && <AddPrescription doctorId={physicianId} />}
            {activeSection === "predictform" && <FetusPredictor doctorId={physicianId} />}
            {activeSection === "fetalsegmentation" && <FetalSegmentation doctorId={physicianId} />}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="phys_portal_mobile_overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default DoctorDashboard;