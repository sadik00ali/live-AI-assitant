import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LabDashboard.css";
import { 
  FaEye
} from "react-icons/fa";
import API_URL from "../../services/api";

function LabDashboard() {
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [testName, setTestName] = useState("");
  const [results, setResults] = useState("");
  const [file, setFile] = useState(null);
  const [labReports, setLabReports] = useState([]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
console.log("patientId",patientInfo);
  // Test categories and types
  const testCategories = {
    "Blood Tests": ["Complete Blood Count", "Lipid Panel", "Blood Glucose", "Liver Function", "Kidney Function"],
    "Urine Tests": ["Urinalysis", "Urine Culture", "Microalbuminuria"],
    "Imaging": ["X-Ray", "MRI", "CT Scan", "Ultrasound"],
    "Cardiac": ["ECG", "Echocardiogram", "Stress Test"],
    "Other": ["Biopsy", "Culture", "Genetic Testing"]
  };

  const statusOptions = ["Pending", "Completed", "Critical", "Normal"];

  useEffect(() => {
    if (patientId) {
      fetchPatientReports();
      fetchPatientInfo();
    }
  }, [patientId]);

const fetchPatientReports = async () => {
  setIsLoading(true);
  try {
    const res = await axios.get(`${API_URL}api/patients/${patientId}/lab-reports`);
    const normalizedReports = (res.data || []).map(r => ({
      ...r,
      results: r.results || "",
      testName: r.testName || "",
      _id: r._id || Math.random().toString()
    }));
    setLabReports(normalizedReports);
  } catch (err) {
    console.error("Error fetching lab reports:", err);
    setMessage("Error fetching lab reports");
  } finally {
    setIsLoading(false);
  }
};

  const fetchPatientInfo = async () => {
    try {
      const res = await axios.get(`${API_URL}api/patients/${patientId}`);
      setPatientInfo(res.data);
    } catch (err) {
      console.error("Error fetching patient info:", err);
      setPatientInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!patientId || !date || !testName || !results || !file) {
      setMessage("All fields are required");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("patientId", patientId);
    formData.append("date", date);
    formData.append("testName", testName);
    formData.append("results", results);
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_URL}api/lab-reports/add`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage(res.data.message);
      setLabReports((prev) => [...prev, res.data.labReport]);
      resetForm();
    } catch (err) {
      console.error("Error adding report:", err);
      setMessage("Error adding report");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDate("");
    setTestName("");
    setResults("");
    setFile(null);
  };

  const filteredReports = labReports.filter(report =>
    report.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.results?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewReportDetails = (report) => {
    setSelectedReport(report);
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
  };

  const downloadReport = (report) => {
    if (report.file) {
      window.open(report.file, '_blank');
    }
  };

  return (
    <div className="lab-dashboard">
      {/* Header */}
      <div className="lab-header">
        <h1>Laboratory Management System</h1>
        <p>Manage patient lab reports and test results</p>
      </div>

      <div className="lab-content">
        {/* Sidebar */}
        <div className="lab-sidebar">
          <div className="sidebar-section">
            <h3>Test Categories</h3>
            <div className="category-list">
              {Object.entries(testCategories).map(([category, tests]) => (
                <div key={category} className="category-item">
                  <h4>{category}</h4>
                  <ul>
                    {tests.map(test => (
                      <li key={test}>{test}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lab-main">
          {/* Patient Search Section */}
          <div className="patient-search-section">
            <h2>Patient Lookup</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Enter Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="search-input"
              />
              <button className="search-btn">🔍</button>
            </div>
            
            {patientInfo && (
              <div className="patient-info-card">
                <h3>Patient Information</h3>
                <div className="patient-details">
                  <p><strong>Name:</strong> {patientInfo.name}</p>
                  <p><strong>Age:</strong> {patientInfo.age}</p>
                  <p><strong>Gender:</strong> {patientInfo.gender}</p>
                  <p><strong>Contact:</strong> {patientInfo.contact?.phone || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Add Report Form */}
          <div className="add-report-section">
            <h2>Add New Lab Report</h2>
            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Test Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Test Type</label>
                  <select
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    required
                  >
                    <option value="">Select Test Type</option>
                    {Object.entries(testCategories).map(([category, tests]) => (
                      <optgroup key={category} label={category}>
                        {tests.map(test => (
                          <option key={test} value={test}>{test}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Results</label>
                  <textarea
                    placeholder="Enter test results..."
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Upload Report File</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      required
                    />
                    {file && <span className="file-name">{file.name}</span>}
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Adding Report..." : "➕ Add Lab Report"}
              </button>
            </form>

            {message && (
              <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
                {message}
              </div>
            )}

            
          </div>

          {/* Reports List */}

        </div>

                  <div className="reports-section">
            <div className="section-header">
              <h2>Lab Reports</h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="loading">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="no-reports">
                {patientId ? "No lab reports found for this patient" : "Enter a Patient ID to view reports"}
              </div>
            ) : (
              <div className="reports-grid">
                {filteredReports.map((report) => (
                  <div key={report._id} className="report-card">
                    <div className="card-header">
                      <h3>{report.testName}</h3>
                      <span className={`status-badge ${report.status?.toLowerCase() || 'pending'}`}>
                        {report.status || 'Pending'}
                      </span>
                    </div>
                    <div className="card-content">
                      <p><strong>Date:</strong> {new Date(report.date).toLocaleDateString()}</p>
                      <p><strong>Results:</strong> {report.results.substring(0, 100)}...</p>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => viewReportDetails(report)} className="view-lab">
                        View Details
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Lab Report Details</h2>
              <button onClick={closeReportDetails} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="report-details">
                <div className="detail-row">
                  <span className="detail-label">Test Name:</span>
                  <span className="detail-value">{selectedReport.testName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{new Date(selectedReport.date).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status ${selectedReport.status?.toLowerCase() || 'pending'}`}>
                    {selectedReport.status || 'Pending'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Results:</span>
                  <span className="detail-value">{selectedReport.results}</span>
                </div>
{selectedReport?.file && (
  <div className="detail-row">
    {/* <span className="detail-label">Report File:</span> */}
    <span className="detail-value">
      <div className="report-actions">
        <a
          href={`http://127.0.0.1:5000${selectedReport.file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="report-action-button view-report-button"
        >
          <FaEye className="action-icon" />
          View Report
        </a>
      </div>
    </span>
  </div>
)}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LabDashboard;