import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next"
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "../../shared/layouts/AppLayout";
import { ScrollToTop } from "../../shared/components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Patient from "./pages/Patients/Patient";
import Appointment from "./pages/Appointment/Appointment";
import Profile from "./pages/Profile/Profile";
import Schedule from "./pages/Schedules/Schedule";

const RequireDoctor: React.FC<{ children: React.ReactNode; allowedType?: string }> = ({ children, allowedType }) => {
  const { t } = useTranslation()
  const role = localStorage.getItem("authRole")
  const doctorType = localStorage.getItem("doctorType")

  if (role !== "D") {
    return <Navigate to="/login" replace />
  }
  if (allowedType && doctorType !== allowedType) {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}

const UnauthorizedPage: React.FC = () => {
  const { t } = useTranslation()
  return <div>{t("navigation.unauthorized")}</div>
}

const DoctorApp: React.FC = () => {
  const { t } = useTranslation()

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Doctor Examination Routes (type: E) */}
        <Route
          path="examination/*"
          element={
            <RequireDoctor allowedType="E">
              <AppLayout />
            </RequireDoctor>
          }
        >
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Home />} />
          <Route path="patients" element={<Patient />} />
          <Route path="appointment" element={<Appointment />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Doctor Service Routes (type: S) */}
        <Route
          path="service/*"
          element={
            <RequireDoctor allowedType="S">
              <AppLayout />
            </RequireDoctor>
          }
        >
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Home />} />
          <Route path="appointment" element={<Appointment />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="profile" element={<Profile />} />
          {/* Không có route /patients cho bác sĩ loại S */}
        </Route>

        {/* Redirect doctor root to appropriate type */}
        <Route
          index
          element={
            <RequireDoctor>
              <Navigate
                to={
                  localStorage.getItem("doctorType") === "E"
                    ? "/doctor/examination"
                    : localStorage.getItem("doctorType") === "S"
                      ? "/doctor/service"
                      : "/login"
                }
                replace
              />
            </RequireDoctor>
          }
        />

        {/* Unauthorized Route */}
        <Route path="unauthorized" element={<UnauthorizedPage />} />

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default DoctorApp