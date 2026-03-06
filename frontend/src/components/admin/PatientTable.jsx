import React, { useState, useEffect } from 'react';
import './PatientTable.css';
import API_URL from '../../services/api';

const PatientTable = ({ showAddForm = true }) => {
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    bloodGroup: 'A+',
    type: 'OPD',
    medicalSpecialty: '',
    description: '',
    password: '',
    image: null,
    contact: { phone: '', email: '', address: '' },
    insurance: { provider: '', policyNumber: '' },
    wardNumber: '',
    cartNumber: ''
  });

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/departments`);
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Fetch patients
  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patients`);

      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchPatients();
  }, []);

  // Fetch available doctors for selected specialty
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!formData.medicalSpecialty) {
        setAvailableDoctors([]);
        return;
      }
      try {
        const res = await fetch(
          `${API_URL}/staff/available?specialty=${formData.medicalSpecialty}`
        );
        const data = await res.json();
        setAvailableDoctors(data);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    };
    fetchDoctors();
  }, [formData.medicalSpecialty]);

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setFormData((prev) => ({
      ...prev,
      image: file
    }));
  }
};

  // Add or update patient
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {

    const data = new FormData();

    data.append("name", formData.name);
    data.append("age", formData.age);
    data.append("gender", formData.gender);
    data.append("bloodGroup", formData.bloodGroup);
    data.append("type", formData.type);
    data.append("medicalSpecialty", formData.medicalSpecialty);
    data.append("description", formData.description);
    data.append("password", formData.password);
    data.append("wardNumber", formData.wardNumber);
    data.append("cartNumber", formData.cartNumber);

    data.append("phone", formData.contact.phone);
    data.append("email", formData.contact.email);
    data.append("address", formData.contact.address);

    data.append("provider", formData.insurance.provider);
    data.append("policyNumber", formData.insurance.policyNumber);

    data.append("assignedDoctor", selectedDoctor?._id || "");

    if (formData.image) {
      data.append("image", formData.image);
    }

    let res;

    if (editingPatient) {
      res = await fetch(`${API_URL}/api/patients/${editingPatient._id}`, {
        method: "PUT",
        body: data
      });
    } else {
      res = await fetch(`${API_URL}/api/patients`, {
        method: "POST",
        body: data
      });
    }

    if (!res.ok) throw new Error("Failed to save patient");

    setShowAddPopup(false);
    setEditingPatient(null);
    setSelectedDoctor(null);

    fetchPatients();

  } catch (err) {
    console.error("Error saving patient:", err);
  } finally {
    setLoading(false);
  }
};

  // Edit patient
  const handleEdit = (patient) => {
    setEditingPatient(patient);

    setFormData({
      name: patient.name || '',
      age: patient.age || '',
      gender: patient.gender || 'male',
      bloodGroup: patient.bloodGroup || 'A+',
      type: patient.type || 'OPD',
      medicalSpecialty: patient.medicalSpecialty || '',
      description: patient.description || '',
      password: '',
      contact: patient.contact || { phone: '', email: '', address: '' },
      insurance: patient.insurance || { provider: '', policyNumber: '' },
      wardNumber: patient.wardNumber || '',
      cartNumber: patient.cartNumber || '',
    });

    setSelectedDoctor(
      patient.assignedDoctor
        ? { _id: patient.assignedDoctor, name: patient.assignedDoctorName }
        : null
    );

    setShowAddPopup(true);
  };

  // Delete patient
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete patient');
      fetchPatients();
    } catch (err) {
      console.error('Error deleting patient:', err);
    }
  };
const filteredPatients = patients.filter(
  (p) =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.patientId || '').toLowerCase().includes(searchTerm.toLowerCase())
);
  const handleChangePage = (newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'admitted':
        return 'status-admitted';
      case 'discharged':
        return 'status-discharged';
      default:
        return 'status-other';
    }
  };

  return (
    <div className="patient-table-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {showAddForm && (
          <button
            onClick={() => setShowAddPopup(true)}
            className="add-patient-btn"
          >
            + Add Patient
          </button>
        )}
      </div>

      <table className="patient-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Status</th>
            <th>Doctor</th>
            <th>Ward</th>
            <th>Cart</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((p) => (
              <tr key={p._id}>
              <td>
                <img
                  src={`${API_URL}/api/patient/image/${p._id}`}
                  width="40"
                  height="40"
                  style={{ borderRadius: "50%" }}
                  alt="patient"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/40";
                  }}
                />
              </td>
                <td>{p.patientId}</td>
                <td>{p.name}</td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(p.status)}`}>
                    {p.status || 'unknown'}
                  </span>
                </td>
                <td>{p.assignedDoctorName || 'Unassigned'}</td>
                <td>{p.wardNumber || '-'}</td>
                <td>{p.cartNumber || '-'}</td>
                <td>
                  <button onClick={() => handleEdit(p)} className="edit-btn">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination-container">
        <button onClick={() => handleChangePage(page - 1)} disabled={page === 0}>
          Prev
        </button>
        <span>
          Page {page + 1} of {Math.ceil(filteredPatients.length / rowsPerPage)}
        </span>
        <button
          onClick={() => handleChangePage(page + 1)}
          disabled={
            page >= Math.ceil(filteredPatients.length / rowsPerPage) - 1
          }
        >
          Next
        </button>
        <select value={rowsPerPage} onChange={handleChangeRowsPerPage}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
        </select>
      </div>

      {/* Add / Edit Popup */}
      {showAddPopup && (
        <div className="popup-overlay">
          <div className="add-patient-popup">
            <div className="popup-header">
              <h3>{editingPatient ? 'Edit Patient' : 'New Patient Registration'}</h3>
              <button
                onClick={() => {
                  setShowAddPopup(false);
                  setEditingPatient(null);
                }}
                className="close-popup-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                />
                <div className="image-upload">
                <label>Patient Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Age"
                  required
                />
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
                    (g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    )
                  )}
                </select>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="OPD">OPD</option>
                  <option value="IPD">IPD</option>
                </select>
                <select
                  name="medicalSpecialty"
                  value={formData.medicalSpecialty}
                  onChange={handleChange}
                >
                  <option value="">Select Specialty</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  name="assignedDoctor"
                  value={selectedDoctor?._id || ''}
                  onChange={(e) => {
                    const doc = availableDoctors.find(
                      (d) => d._id === e.target.value
                    );
                    setSelectedDoctor(doc || null);
                  }}
                >
                  <option value="">Select Doctor</option>
                  {availableDoctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description"
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required={!editingPatient}
                />
                <input
                  type="tel"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  required
                />
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
                <input
                  type="text"
                  name="contact.address"
                  value={formData.contact.address}
                  onChange={handleChange}
                  placeholder="Address"
                />
                <input
                  type="text"
                  name="insurance.provider"
                  value={formData.insurance.provider}
                  onChange={handleChange}
                  placeholder="Insurance Provider"
                />
                <input
                  type="text"
                  name="insurance.policyNumber"
                  value={formData.insurance.policyNumber}
                  onChange={handleChange}
                  placeholder="Policy Number"
                />
                <input
                  type="text"
                  name="wardNumber"
                  value={formData.wardNumber}
                  onChange={handleChange}
                  placeholder="Ward Number"
                />
                <input
                  type="text"
                  name="cartNumber"
                  value={formData.cartNumber}
                  onChange={handleChange}
                  placeholder="Cart Number"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPopup(false);
                    setEditingPatient(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTable;
