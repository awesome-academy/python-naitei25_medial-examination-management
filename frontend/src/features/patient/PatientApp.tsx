"use client"
import { useTranslation } from "react-i18next"

function PatientApp() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{t("roles.patient")} App</h1>
        <p className="text-gray-600">
          {t("common.welcome")} {t("roles.patient")}!
        </p>
      </div>
    </div>
  )
}

export default PatientApp
