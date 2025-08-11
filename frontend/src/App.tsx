import React from 'react';
import { Routes, Route, useLocation } from "react-router-dom";
import AuthApp from './features/auth/AuthApp';
import AdminApp from './features/admin/AdminApp';
import DoctorApp from './features/doctor/DoctorApp';
import PatientApp from './features/patient/PatientApp';
import HomePage from './features/patient/pages/HomePage';
import { AuthProvider } from "./shared/context/AuthContext";
import { SidebarProvider } from "./shared/context/SidebarContext";
import ProtectedRoute from './shared/components/ProtectedRoute';

// Debug component để log routing
const RouteDebugger = () => {
  const location = useLocation();
  console.log('Current location:', location.pathname);
  return null;
};

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <RouteDebugger />
        <Routes>
          {/* Trang chủ công khai - không cần đăng nhập */}
          <Route path="/" element={<HomePage />} />

          {/* Auth routes - Không có ProtectedRoute */}
          <Route path="/auth/*" element={<AuthApp />} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="A">
                <AdminApp />
              </ProtectedRoute>
            }
          />

          {/* Doctor routes */}
          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute requiredRole="D">
                <DoctorApp />
              </ProtectedRoute>
            }
          />

          {/* Patient routes - chỉ các route cần đăng nhập */}
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute requiredRole="P">
                <PatientApp />
              </ProtectedRoute>
            }
          />

          {/* Route dự phòng toàn cục */}
          <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />
        </Routes>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;