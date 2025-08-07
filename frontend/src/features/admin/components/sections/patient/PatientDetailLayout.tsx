import { useState } from "react";
import PatientSidebar from "./PatientSidebar";
import {
  MedicalRecordsContent,
  AppointmentsContent,
  InvoicesContent,
  PaymentsContent,
  PatientInfoContent,
  HealthInfoContent,
  ContactInfoContent,
} from "./PatientDetailContent";

export default function PatientDetailLayout() {
  const [activeTab, setActiveTab] = useState("medical-records");

  // Content mapping based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "medical-records":
        return <MedicalRecordsContent />;
      case "appointments":
        return <AppointmentsContent />;
      case "invoices":
        return <InvoicesContent />;
      // case "payments":
      //   return <PaymentsContent />;
      case "patient-info":
        return <PatientInfoContent />;
      case "health-info":
        return <HealthInfoContent />;
      case "contact-info":
        return <ContactInfoContent />;
      default:
        return <InvoicesContent />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-1">
        <PatientSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className="md:col-span-3">{renderContent()}</div>
    </div>
  );
}
