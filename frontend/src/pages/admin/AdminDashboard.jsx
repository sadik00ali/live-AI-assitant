import React, { useState, useEffect } from 'react';
import { FaUserInjured as PatientsIcon, FaProcedures as BedIcon, FaUserNurse as StaffIcon, 
         FaBoxes as InventoryIcon, FaCalendarAlt as AppointmentsIcon, 
         FaMoneyBillWave as FinanceIcon, FaExclamationTriangle as AlertsIcon, 
         FaFileMedicalAlt as EmergencyIcon } from 'react-icons/fa';
import './AdminDashboard.css';
import api from '../../services/api';

import OverviewCards from '../../components/admin/OverviewCards';
import PatientTable from '../../components/admin/PatientTable';
import StaffTable from '../../components/admin/StaffTable';
import InventoryList from '../../components/admin/InventoryList';
import AppointmentCalendar from '../../components/admin/AppointmentCalendar';
import FinanceChart from '../../components/admin/FinanceChart';
import Bedocc from '../../components/admin/BedOccupancy';
import PatientPred from '../../components/admin/PatientPrediction';
import Emergency from '../../components/admin/Emergency';
// resuable hooks
import useDoctorAlerts from '../../components/reusable/useDoctorAlerts';


const AdminDashboard = () => {
  useDoctorAlerts();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    recentPatients: [],
    staff: [],
    inventory: [],
    appointments: [],
    alerts: [],
    stats: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, patients, staff, inventory, appointments, alerts] =
          await Promise.all([
            api.get('/dashboard/stats'),
            api.get('/patients?limit=5'),
            api.get('/staff?onDuty=true'),
            api.get('/inventory?lowStock=true'),
            api.get('/appointments?upcoming=true'),
            api.get('/alerts')
          ]);

        setDashboardData({
          stats: stats.data || {},
          recentPatients: patients.data || [],
          staff: staff.data || [],
          inventory: inventory.data || [],
          appointments: appointments.data || [],
          alerts: alerts.data || []
        });
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BedIcon /> },
    { id: 'patients', label: 'Patients', icon: <PatientsIcon /> },
    { id: 'staff', label: 'Staff', icon: <StaffIcon /> },
    // { id: 'inventory', label: 'Inventory', icon: <InventoryIcon /> },
    // { id: 'appointments', label: 'Appointments', icon: <AppointmentsIcon /> },
    // { id: 'reports', label: 'Reports', icon: <FinanceIcon /> },
    { id: 'average-patients', label: 'Avg Patients', icon: <PatientsIcon /> },
    { id: 'bed-occupancy', label: 'Bed Occupancy', icon: <BedIcon /> },
    {id :'emergency',label: 'Emergency',icon: <EmergencyIcon  />}
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Hospital Admin Dashboard</h1>
        <div className={`alert-badge ${dashboardData.alerts?.length ? 'has-alerts' : ''}`}>
          <AlertsIcon className="alert-icon" />
          <span>{dashboardData.alerts?.length || 0} Active Alerts</span>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      {activeTab === 'patients' && <PatientTable patients={dashboardData.recentPatients} />}
      {activeTab === 'staff' && <StaffTable staff={dashboardData.staff} />}
      {activeTab === 'inventory' && <InventoryList inventory={dashboardData.inventory} />}
      {activeTab === 'appointments' && (
        <AppointmentCalendar appointments={dashboardData.appointments} />
      )}
      {activeTab === 'reports' && <FinanceChart data={dashboardData.stats} />}
      {activeTab === 'average-patients' && <PatientPred />}
      {activeTab === 'bed-occupancy' && <Bedocc />}
      {activeTab === 'dashboard' && <OverviewCards stats={dashboardData.stats} />}
      {activeTab === 'emergency' && <Emergency />}
    </div>
  );
};

export default AdminDashboard;
