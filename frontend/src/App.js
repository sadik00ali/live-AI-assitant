// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard"
import PharmacyStock from "./pages/pharmacy/ManageStock";
import PharmacyViewPrescriptions from "./pages/pharmacy/ViewPrescriptions";
import Chatbot from './Chatbot';
import LabDashboard from './pages/lab/LabDashboard'
function LayoutWrapper({ children }) {
  const location = useLocation();
  const noNavRoutes = ["/"]; // routes where navbar/footer is hidden
  const hideNav = noNavRoutes.includes(location.pathname);

  return (
    <>
      {!hideNav && <Navbar />}
      {children}
      {/* {!hideNav && <Footer />} */}
    </>
  );
}

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
          <Route path="/pharmacy/manage-stock" element={<PharmacyStock />} />
          <Route path="/pharmacy/view-prescriptions" element={<PharmacyViewPrescriptions />} />
          {/* <Route path="/prescriptions/:patientId" element={<Prescriptions />} /> */}
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/lab/dashboard" element={<LabDashboard/>}/>

        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
