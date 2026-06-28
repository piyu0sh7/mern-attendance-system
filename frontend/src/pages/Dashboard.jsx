import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import EmployeeDashboard from './EmployeeDashboard';
import ManagerDashboard from './ManagerDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Manager':
      return <ManagerDashboard />;
    case 'Employee':
    default:
      return <EmployeeDashboard />;
  }
};

export default Dashboard;
