import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import {
  Pill,
  User,
  Calendar,
  Plus,
  X,
  FileText,
  Loader,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  Filter,
  Download,
  Printer,
  Shield,
  AlertOctagon
} from "lucide-react";
import styles from "./Prescriptions.modules.css";
import API_URL from "../../services/api";

// Enhanced Autocomplete component with better styling
function Autocomplete({ options = [], value = null, onSelect, placeholder = "Search...", labelKey = "name" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value ? value[labelKey] || "" : "");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value ? value[labelKey] || "" : "");
  }, [value, labelKey]);

  const filtered = useMemo(() => {
    if (!query) return options.slice(0, 8);
    const q = query.toLowerCase();
    return options
      .filter((opt) => (opt[labelKey] || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [options, query, labelKey]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlight((h) => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      const picked = filtered[highlight];
      if (picked) {
        onSelect(picked);
        setOpen(false);
        setQuery(picked[labelKey] || "");
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="autocomplete-wrapper" ref={containerRef}>
      <div className="autocomplete-input-wrapper">
        <Search size={16} className="autocomplete-search-icon" />
        <input
          className="autocomplete-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="autocomplete-dropdown">
          {filtered.map((opt, i) => (
            <li
              key={opt.id || `${i}-${opt[labelKey]}`}
              className={`autocomplete-item ${i === highlight ? "highlighted" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => { onSelect(opt); setOpen(false); setQuery(opt[labelKey] || ""); }}
            >
              <div className="autocomplete-item-main">{opt[labelKey]}</div>
              {opt.short_composition1 && (
                <div className="autocomplete-item-sub">{opt.short_composition1}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Stat Card Component for dashboard metrics
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${color}`}>
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

// CDSS Alert Modal Component
function CdssAlertModal({ alert, onIgnore, onModify }) {
  if (!alert) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content cdss-modal">
        <div className="modal-header cdss-modal-header">
          <AlertOctagon size={24} className="cdss-modal-icon" />
          <h3>Clinical Decision Support Alert</h3>
          <button className="modal-close" onClick={onModify}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="cdss-modal-message">{alert.message}</p>
          
          <div className="cdss-analysis-section">
            <h4>Risk Analysis:</h4>
            <ul className="cdss-analysis-list">
              {alert.analysis.map((risk, index) => (
                <li key={index}>
                  <AlertCircle size={16} />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="cdss-recommendation">
            <Shield size={18} />
            <span>Review prescription before proceeding</span>
          </div>
        </div>
        
        <div className="modal-footer cdss-modal-footer">
          <button className="btn-secondary" onClick={onModify}>
            Modify Prescription
          </button>
          <button className="btn-danger" onClick={onIgnore}>
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

function Prescriptions() {
  const [patientList, setPatientList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [prescriptionForms, setPrescriptionForms] = useState({});
  const [expandedPatients, setExpandedPatients] = useState({});
  const [medicationOptions, setMedicationOptions] = useState([]);
  const [cdssAlert, setCdssAlert] = useState(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [debouncedPatientQuery, setDebouncedPatientQuery] = useState("");
  const [pendingSubmission, setPendingSubmission] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showStats, setShowStats] = useState(true);

  const timingOptions = [
    "Before breakfast", "After breakfast", "Before lunch",
    "After lunch", "Before dinner", "After dinner",
    "At bedtime", "As needed"
  ];

  const dosageOptions = [
    "1 tablet", "2 tablets", "1/2 tablet", "1 capsule",
    "5ml", "10ml", "15ml", "As directed"
  ];

  // Debounce patient search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPatientQuery(patientQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [patientQuery]);

  // Fetch medicines
  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_URL}/api/medicines`).then(res => {
      if (cancelled) return;
      const normalized = (res.data || []).map((m) => ({
        id: m.id || (m._id || {}).toString?.() || String(Math.random()),
        name: m.name || m.product_name || m.label || "",
        short_composition1: (m.short_composition1 || "").trim(),
        short_composition2: (m.short_composition2 || "").trim(),
        composition: [
          (m.short_composition1 || "").trim(),
          (m.short_composition2 || "").trim()
        ].filter(Boolean)
      }));
      setMedicationOptions(normalized);
    }).catch(err => {
      console.error("Error loading medicines:", err);
    });
    return () => { cancelled = true; };
  }, []);

  // Fetch patients
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const physicianData = JSON.parse(localStorage.getItem("userData"));
        const physicianId = physicianData?._id;
        if (!physicianId) {
          setErrorMessage("Physician identification not available");
          setIsLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/api/patients/by-doctor/${physicianId}`
        );
        setPatientList(response.data || []);
      } catch (err) {
        console.error(err);
        setErrorMessage("Unable to load patient information");
        setPatientList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!debouncedPatientQuery) return patientList;
    const q = debouncedPatientQuery.toLowerCase();
    return patientList.filter(p => (
      (p.name || "").toLowerCase().includes(q) ||
      (p.patientId || "").toString().toLowerCase().includes(q) ||
      (p.mobile || "").toLowerCase().includes(q)
    ));
  }, [patientList, debouncedPatientQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPatients = patientList.length;
    const patientsWithPrescriptions = patientList.filter(p => p.prescriptions?.length > 0).length;
    const totalPrescriptions = patientList.reduce((acc, p) => acc + (p.prescriptions?.length || 0), 0);
    const recentPrescriptions = patientList.reduce((acc, p) => {
      return acc + (p.prescriptions?.filter(pr => {
        const prDate = new Date(pr.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return prDate >= sevenDaysAgo;
      }).length || 0);
    }, 0);

    return { totalPatients, patientsWithPrescriptions, totalPrescriptions, recentPrescriptions };
  }, [patientList]);

  const togglePatientView = (patientId) => {
    setExpandedPatients(prev => ({ ...prev, [patientId]: !prev[patientId] }));
  };

  const updateMedicationField = (patientId, field, value, index = 0) => {
    setPrescriptionForms((prev) => {
      const patientForm = prev[patientId] || {
        medications: [{}],
        prescriptionDate: new Date().toISOString().split('T')[0]
      };

      let medications = [...patientForm.medications];

      if (field === "name" && value && typeof value === "object") {
        medications[index] = {
          ...medications[index],
          name: value.name,
          composition: value.composition || [],
          short_composition1: value.short_composition1 || "",
          short_composition2: value.short_composition2 || ""
        };
      } else {
        medications[index] = { ...medications[index], [field]: value };
      }

      return { ...prev, [patientId]: { ...patientForm, medications } };
    });
  };

  const addMedicationEntry = (patientId) => {
    setPrescriptionForms((prev) => {
      const patientForm = prev[patientId] || { 
        medications: [{}], 
        prescriptionDate: new Date().toISOString().split('T')[0] 
      };
      return { 
        ...prev, 
        [patientId]: { 
          ...patientForm, 
          medications: [...patientForm.medications, {}] 
        } 
      };
    });
  };

  const removeMedicationEntry = (patientId, index) => {
    setPrescriptionForms((prev) => {
      const patientForm = prev[patientId];
      if (!patientForm || patientForm.medications.length <= 1) return prev;
      const medications = patientForm.medications.filter((_, i) => i !== index);
      return { ...prev, [patientId]: { ...patientForm, medications } };
    });
  };

  const updatePrescriptionDate = (patientId, value) => {
    setPrescriptionForms((prev) => {
      const patientForm = prev[patientId] || { 
        medications: [{}], 
        prescriptionDate: value 
      };
      return { ...prev, [patientId]: { ...patientForm, prescriptionDate: value } };
    });
  };

  const submitPrescription = async (patientId) => {
    const formData = prescriptionForms[patientId];
    
    const payload = {
      date: formData.prescriptionDate,
      medicines: formData.medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        time: m.time,
        composition: m.composition || [m.short_composition1, m.short_composition2].filter(Boolean)
      }))
    };

    try {
      const response = await axios.post(
        `${API_URL}/api/patients/${patientId}/prescriptions`,
        payload
      );

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'success-notification';
      notification.innerHTML = `
        <div class="success-content">
          <CheckCircle size={20} />
          <span>Prescription successfully recorded!</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

      setPatientList((prev) => prev.map((patient) => 
        patient._id === patientId 
          ? { ...patient, prescriptions: [...(patient.prescriptions || []), response.data.prescription] } 
          : patient
      ));

      setPrescriptionForms((prev) => ({ 
        ...prev, 
        [patientId]: { 
          medications: [{}], 
          prescriptionDate: new Date().toISOString().split('T')[0] 
        } 
      }));

    } catch (err) {
      if (err.response && err.response.data.cdss_analysis) {
        setPendingSubmission({ patientId, payload });
        setCdssAlert({
          message: err.response.data.message,
          analysis: err.response.data.cdss_analysis
        });
      } else {
        alert("Server error");
      }
    }
  };

  const ignoreAndSubmit = async () => {
    if (!pendingSubmission) return;

    try {
      await axios.post(
        `${API_URL}/api/patients/${pendingSubmission.patientId}/prescriptions?override=true`,
        pendingSubmission.payload
      );

      setCdssAlert(null);
      setPendingSubmission(null);
      
      // Refresh patient data
      const physicianData = JSON.parse(localStorage.getItem("userData"));
      const response = await axios.get(
        `${API_URL}/api/patients/by-doctor/${physicianData._id}`
      );
      setPatientList(response.data || []);

    } catch (err) {
      alert("Override failed");
    }
  };

  if (isLoading) return (
    <div>
      <div>
        <Loader size={48}/>
        <p>Loading patient records...</p>
      </div>
    </div>
  );

  if (errorMessage) return (
    <div className="error-screen">
      <AlertTriangle size={64} className="error-icon" />
      <h2>Unable to Load Data</h2>
      <p>{errorMessage}</p>
      <button onClick={() => window.location.reload()} className="retry-button">
        <Loader size={16} />
        Retry
      </button>
    </div>
  );

  return (
    <div className="prescriptions-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-title-section">
          <div className="title-icon-wrapper">
            <Pill size={32} />
          </div>
          <div>
            <h1>Medication Management</h1>
            <p>Manage prescriptions with clinical decision support</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="action-button" onClick={() => setShowStats(!showStats)}>
            <Activity size={18} />
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
          <button className="action-button">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search patients by name, ID, or phone number..."
            value={patientQuery}
            onChange={(e) => setPatientQuery(e.target.value)}
            className="search-input"
          />
          {patientQuery && (
            <button 
              className="clear-search"
              onClick={() => setPatientQuery("")}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="search-results-count">
          {filteredPatients.length} patients found
        </div>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div className="stats-grid">
          <StatCard 
            icon={User} 
            label="Total Patients" 
            value={stats.totalPatients}
            color="blue"
          />
          <StatCard 
            icon={FileText} 
            label="Active Prescriptions" 
            value={stats.totalPrescriptions}
            color="green"
          />
          <StatCard 
            icon={Calendar} 
            label="Prescribed This Week" 
            value={stats.recentPrescriptions}
            color="purple"
          />
          <StatCard 
            icon={CheckCircle} 
            label="With Prescriptions" 
            value={stats.patientsWithPrescriptions}
            color="orange"
          />
        </div>
      )}

      {/* Patient List */}
      <div className="patients-container">
        {filteredPatients.length === 0 ? (
          <div className="no-results">
            <Search size={48} />
            <h3>No patients found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const patientForm = prescriptionForms[patient._id] || { 
              medications: [{}], 
              prescriptionDate: new Date().toISOString().split('T')[0] 
            };
            const isPatientExpanded = expandedPatients[patient._id];

            return (
              <div key={patient._id} className="patient-card">
                <div 
                  className="patient-card-header"
                  onClick={() => togglePatientView(patient._id)}
                >
                  <div className="patient-avatar">
                    {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div className="patient-info">
                    <h3>{patient.name}</h3>
                    <div className="patient-meta">
                      <span className="patient-id">ID: {patient.patientId}</span>
                      <span className="patient-detail">{patient.age} years • {patient.gender}</span>
                      {patient.prescriptions?.length > 0 && (
                        <span className="prescription-count">
                          {patient.prescriptions.length} prescription{patient.prescriptions.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="expand-button">
                    {isPatientExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {isPatientExpanded && (
                  <div className="patient-card-content">
                    {/* Existing Prescriptions */}
                    <div className="existing-prescriptions">
                      <h4>
                        <FileText size={18} />
                        Current Prescriptions
                      </h4>
                      {patient.prescriptions && patient.prescriptions.length > 0 ? (
                        <div className="prescriptions-grid">
                          {patient.prescriptions.map((prescription, index) => (
                            <div key={index} className="prescription-card">
                              <div className="prescription-card-header">
                                <span className="prescription-date">
                                  <Calendar size={14} />
                                  {new Date(prescription.date).toLocaleDateString()}
                                </span>
                                <span className="prescription-status">Active</span>
                              </div>
                              <div className="prescription-medications">
                                {prescription.medicines && prescription.medicines.map((medicine, medIndex) => (
                                  <div key={medIndex} className="medication-item">
                                    <div className="medication-name">{medicine.name}</div>
                                    <div className="medication-details">
                                      <span className="dosage">{medicine.dosage}</span>
                                      <span className="timing">
                                        <Clock size={12} />
                                        {medicine.time}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-prescriptions">
                          <Pill size={32} />
                          <p>No active prescriptions</p>
                        </div>
                      )}
                    </div>

                    {/* New Prescription Form */}
                    <div className="new-prescription">
                      <h4>
                        <Plus size={18} />
                        New Prescription
                      </h4>

                      <div className="prescription-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              <Calendar size={16} />
                              Prescription Date
                            </label>
                            <input
                              type="date"
                              value={patientForm.prescriptionDate}
                              onChange={(e) => updatePrescriptionDate(patient._id, e.target.value)}
                              className="date-input"
                            />
                          </div>
                        </div>

                        <div className="medications-section">
                          <label>Medication Details</label>
                          
                          {patientForm.medications.map((medication, index) => (
                            <div key={index} className="medication-row">
                              <div className="medication-inputs">
                                <Autocomplete
                                  options={medicationOptions}
                                  value={medication.name ? { 
                                    name: medication.name, 
                                    composition: medication.composition || medication.short_composition1 
                                  } : null}
                                  onSelect={(medObj) => updateMedicationField(patient._id, "name", medObj, index)}
                                  placeholder="Search medicine..."
                                  labelKey="name"
                                />

                                <select 
                                  value={medication.dosage || ""} 
                                  onChange={(e) => updateMedicationField(patient._id, "dosage", e.target.value, index)}
                                  className="select-input"
                                >
                                  <option value="">Dosage</option>
                                  {dosageOptions.map((dosage, i) => (
                                    <option key={i} value={dosage}>{dosage}</option>
                                  ))}
                                </select>

                                <select 
                                  value={medication.time || ""} 
                                  onChange={(e) => updateMedicationField(patient._id, "time", e.target.value, index)}
                                  className="select-input"
                                >
                                  <option value="">Timing</option>
                                  {timingOptions.map((time, i) => (
                                    <option key={i} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>

                              {patientForm.medications.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMedicationEntry(patient._id, index)}
                                  className="remove-button"
                                >
                                  <X size={16} />
                                </button>
                              )}

                              {medication.composition && medication.composition.length > 0 && (
                                <div className="composition-tag">
                                  {medication.composition.join(", ")}
                                </div>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addMedicationEntry(patient._id)}
                            className="add-medication-button"
                          >
                            <Plus size={16} />
                            Add Another Medication
                          </button>
                        </div>

                        <div className="form-actions">
                          <button
                            onClick={() => submitPrescription(patient._id)}
                            className="submit-button"
                          >
                            <Pill size={18} />
                            Submit Prescription
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CDSS Alert Modal */}
      <CdssAlertModal 
        alert={cdssAlert}
        onIgnore={ignoreAndSubmit}
        onModify={() => setCdssAlert(null)}
      />
    </div>
  );
}

export default Prescriptions;