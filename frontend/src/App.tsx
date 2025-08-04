import React from 'react';
import { Routes, Route } from "react-router-dom";
import AuthApp from './features/auth/AuthApp';
import AdminApp from './features/admin/AdminApp';
import DoctorApp from './features/doctor/DoctorApp';
import PatientApp from './features/patient/PatientApp';
import { AuthProvider } from "./shared/context/AuthContext";
import { SidebarProvider } from "./shared/context/SidebarContext";
import ProtectedRoute from './shared/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Routes>
          <Route path="/*" element={<AuthApp />} />
          <Route path="/login/*" element={<AuthApp />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="A">
                <AdminApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute requiredRole="D">
                <DoctorApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute requiredRole="P">
                <PatientApp />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />
        </Routes>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;