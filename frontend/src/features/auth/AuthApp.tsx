import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../../features/auth/pages/Login';
import PatientLoginForm from './components/PatientLoginForm';
import ErrorBoundary from "./components/ErrorBoundary";
import { RegisterProvider } from "./context/RegisterContext";
import RegisterCommon from "./components/RegisterCommon";
import RegisterDetail from "./components/RegisterDetail";
import VerifyOTP from "./components/VerifyOTP";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

const AuthApp: React.FC = () => {
  return (
    <RegisterProvider>
    <ErrorBoundary>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="login" element={<Login />} />
      <Route path="/patient-login" element={<PatientLoginForm />} />
      <Route path="/register" element={<RegisterCommon />} />
      <Route path="/register/details" element={<RegisterDetail />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
    </ErrorBoundary>
    </RegisterProvider>
  );
};

export default AuthApp;