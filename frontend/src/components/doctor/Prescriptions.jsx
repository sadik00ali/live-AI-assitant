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
  Search
} from "lucide-react";
import "./Prescriptions.css";
import API_URL from "../../services/api";

// Small reusable Autocomplete component (no external libs)
function Autocomplete({ options = [], value = null, onSelect, placeholder = "Search...", labelKey = "name" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value ? value[labelKey] || "" : "");
  const [highlight, setHighlight] = useState(0);


  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value ? value[labelKey] || "" : "");
  }, [value, labelKey]);

  const filtered = useMemo(() => {
    if (!query) return options.slice(0, 10);
    const q = query.toLowerCase();
    return options
      .filter((opt) => (opt[labelKey] || "").toLowerCase().includes(q))
      .slice(0, 10);
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
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="ac_container" ref={containerRef}>
      <input
        className="ac_input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
      />

      {open && filtered.length > 0 && (
        <ul className="ac_list" role="listbox">
          {filtered.map((opt, i) => (
            <li
              key={opt.id || `${i}-${opt[labelKey]}`}
              className={`ac_item ${i === highlight ? "highlight" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => { e.preventDefault(); onSelect(opt); setOpen(false); }}
            >
              <div className="ac_item_label">{opt[labelKey]}</div>
              {opt.short_composition1 && (
                <div className="ac_item_sub">{opt.short_composition1}</div>
              )}
            </li>
          ))}
        </ul>
      )}
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

  // Fetch medicines once (consider server-side paging for production)
  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_URL}/api/medicines`).then(res => {
      if (cancelled) return;
      // normalize options: ensure id + name + composition fields
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

  const filteredPatients = useMemo(() => {
    if (!debouncedPatientQuery) return patientList;
    const q = debouncedPatientQuery.toLowerCase();
    return patientList.filter(p => (
      (p.name || "").toLowerCase().includes(q) ||
      (p.patientId || "").toString().toLowerCase().includes(q) ||
      (p.mobile || "").toLowerCase().includes(q)
    ));
  }, [patientList, debouncedPatientQuery]);

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

      // If value is an object (autocomplete), treat it as a medicine selection
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
      const patientForm = prev[patientId] || { medications: [{}], prescriptionDate: new Date().toISOString().split('T')[0] };
      return { ...prev, [patientId]: { ...patientForm, medications: [...patientForm.medications, {}] } };
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
      const patientForm = prev[patientId] || { medications: [{}], prescriptionDate: value };
      return { ...prev, [patientId]: { ...patientForm, prescriptionDate: value } };
    });
  };

  const submitPrescription = async (patientId) => {
    try {
      const formData = prescriptionForms[patientId];
      if (!formData || !formData.prescriptionDate || formData.medications.some(med => !med.name || !med.dosage || !med.time)) {
        alert("Please complete all required medication fields");
        return;
      }

      // Build payload that Flask expects: { date, medicines }
      const payload = {
        date: formData.prescriptionDate,
        medicines: formData.medications.map(m => ({
          name: m.name,
          dosage: m.dosage,
          time: m.time,
          composition: m.composition || [m.short_composition1, m.short_composition2].filter(Boolean)
        }))
      };

      const response = await axios.post(`${API_URL}/api/patients/${patientId}/prescriptions`, payload);

      alert("Prescription successfully recorded!");

      setPatientList((prev) => prev.map((patient) => patient._id === patientId ? { ...patient, prescriptions: [...(patient.prescriptions || []), response.data.prescription] } : patient));

      setPrescriptionForms((prev) => ({ ...prev, [patientId]: { medications: [{}], prescriptionDate: new Date().toISOString().split('T')[0] } }));

    } 
    catch (err) {

      if (err.response && err.response.data.cdss_analysis) {

        setCdssAlert({
          message: err.response.data.message,
          analysis: err.response.data.cdss_analysis
        });

      } else {
        alert("Server error");
      }

    }

  };

  if (isLoading) return (
    <div className="med_manager_loading">
      <Loader className="med_manager_spinner" size={32} />
      <p>Loading patient records...</p>
    </div>
  );

  if (errorMessage) return (
    <div className="med_manager_error">
      <AlertTriangle size={48} className="med_manager_error_icon" />
      <h3>Data Loading Issue</h3>
      <p>{errorMessage}</p>
      <button onClick={() => window.location.reload()} className="med_manager_retry_btn">Refresh Data</button>
    </div>
  );

  return (
    <div className="med_manager_container improved">
      <div className="med_manager_header improved_header">
        <div className="med_manager_title_section">
          <Pill size={28} className="med_manager_header_icon" />
          <div>
            <h1 className="med_manager_main_title">Medication Management</h1>
            <p className="med_manager_subtitle">Search patients, prescribe medications with composition-aware data</p>
          </div>
        </div>

        <div className="med_manager_controls">
          <div className="patient_search">
            <Search size={16} />
            <input
              placeholder="Search patient by name, ID or phone"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="med_patient_list improved_list">
        {filteredPatients.length === 0 && (
          <div className="no_results">No patients found</div>
        )}

        {filteredPatients.map((patient) => {
          const patientForm = prescriptionForms[patient._id] || { medications: [{}], prescriptionDate: new Date().toISOString().split('T')[0] };
          const isPatientExpanded = expandedPatients[patient._id];

          return (
            <div key={patient._id} className="med_patient_card improved_card">
              <div className="med_patient_summary" onClick={() => togglePatientView(patient._id)}>
                <div className="med_patient_identity">
                  <div className="med_patient_avatar">{patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}</div>
                  <div className="med_patient_info">
                    <h3 className="med_patient_name">{patient.name}</h3>
                    <p className="med_patient_details">ID: {patient.patientId} • {patient.age} yrs • {patient.gender}</p>
                  </div>
                </div>
                <div className="med_patient_controls">
                  <div className="med_expand_indicator">{isPatientExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                </div>
              </div>

              {isPatientExpanded && (
                <div className="med_patient_expanded improved_expanded">
                  <div className="left_col">
                    <div className="med_existing_prescriptions">
                      <h4 className="med_section_title"><FileText size={18} /> Current Prescriptions</h4>
                      {patient.prescriptions && patient.prescriptions.length > 0 ? (
                        <div className="med_prescriptions_grid">
                          {patient.prescriptions.map((prescription, index) => (
                            <div key={index} className="med_prescription_card">
                              <div className="med_prescription_header">
                                <span className="med_prescription_date"><Calendar size={14} />{new Date(prescription.date).toLocaleDateString()}</span>
                                <span className="med_prescription_status">Active</span>
                              </div>
                              <div className="med_medications_list">
                                {prescription.medicines && prescription.medicines.map((medicine, medIndex) => (
                                  <div key={medIndex} className="med_medication_item">
                                    <div className="med_medication_name">{medicine.name}</div>
                                    <div className="med_medication_schedule">{medicine.dosage} • {medicine.time}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="med_no_prescriptions"><Pill size={24} /><p>No active prescriptions</p></div>
                      )}
                    </div>
                  </div>

                  <div className="right_col">
                    <div className="med_new_prescription">
                      <h4 className="med_section_title"><Plus size={18} /> New Prescription</h4>
                      <div className="med_form_group">
                        <label className="med_form_label"><Calendar size={16} /> Prescription Date</label>
                        <input type="date" value={patientForm.prescriptionDate} onChange={(e) => updatePrescriptionDate(patient._id, e.target.value)} className="med_date_input" />
                      </div>

                          {cdssAlert && (
                          <div className="cdss_warning_box">
                            <AlertTriangle size={18} color="red"/>
                            <h4>Clinical Risk Detected</h4>
                            <ul>
                              {cdssAlert.analysis.map((r,i)=>(
                                <li key={i}>{r}</li>
                              ))}
                              </ul>


                            <button
                              className="cdss_close_btn"
                              onClick={() => setCdssAlert(null)}
                            >
                              Ignore & Modify
                            </button>
                          </div>
                        )}


                      <div className="med_medications_form">
                        <label className="med_form_label">Medication Details</label>

                        {patientForm.medications.map((medication, index) => (
                          <div key={index} className="med_medication_row improved_row">
                            <div className="med_medication_fields">
                              <Autocomplete
                                options={medicationOptions}
                                value={medication.name ? { name: medication.name, composition: medication.composition || medication.short_composition1 } : null}
                                onSelect={(medObj) => updateMedicationField(patient._id, "name", medObj, index)}
                                placeholder="Search medicine by name or composition"
                                labelKey="name"
                              />

                              <select value={medication.dosage || ""} onChange={(e) => updateMedicationField(patient._id, "dosage", e.target.value, index)} className="med_dosage_select">
                                <option value="">Dosage</option>
                                {dosageOptions.map((dosage, i) => <option key={i} value={dosage}>{dosage}</option>)}
                              </select>

                              <select value={medication.time || ""} onChange={(e) => updateMedicationField(patient._id, "time", e.target.value, index)} className="med_timing_select">
                                <option value="">Timing</option>
                                {timingOptions.map((time, i) => <option key={i} value={time}>{time}</option>)}
                              </select>
                            </div>

                            {patientForm.medications.length > 1 && (
                              <button type="button" onClick={() => removeMedicationEntry(patient._id, index)} className="med_remove_btn"><X size={16} /></button>
                            )}

                            {medication.composition && medication.composition.length > 0 && (
                              <div className="composition_chip">{medication.composition.join(", ")}</div>
                            )}

                          </div>
                        ))}

                        <button type="button" onClick={() => addMedicationEntry(patient._id)} className="med_add_btn"><Plus size={16} /> Add Another Medication</button>

                      </div>

                      <div className="form_actions">
                        <button onClick={() => submitPrescription(patient._id)} className="med_submit_btn"><Pill size={18} /> Submit Prescription</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Prescriptions;
