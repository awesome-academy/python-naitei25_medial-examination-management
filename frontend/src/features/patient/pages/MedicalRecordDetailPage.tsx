import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { prescriptionService, Prescription } from "../../../shared/services/prescriptionService"

const MedicalRecordDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    prescriptionService
      .getPrescriptionById(Number(id))
      .then((data) => setRecord(data))
      .catch(() => setRecord(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p>{t("common.loading")}</p>
  if (!record) return <p>{t("common.error")}</p>

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">{t("medicalRecord.title")}</h1>
      <div className="space-y-2">
        <p><strong>{t("medicalRecord.diagnosis")}:</strong> {record.diagnosis}</p>
        <p><strong>{t("medicalRecord.bloodPressure")}:</strong> {record.systolic_blood_pressure}/{record.diastolic_blood_pressure} mmHg</p>
        <p><strong>{t("medicalRecord.heartRate")}:</strong> {record.heart_rate} bpm</p>
        <p><strong>{t("medicalRecord.bloodSugar")}:</strong> {record.blood_sugar} mg/dL</p>
        <p><strong>{t("medicalRecord.note")}:</strong> {record.note || t("common.noData")}</p>
        <p><strong>{t("medicalRecord.followUpDate")}:</strong> {record.follow_up_date ? formatDate(record.follow_up_date) : t("common.noData")}</p>
        <p><strong>{t("medicalRecord.createdAt")}:</strong> {formatDate(record.created_at)}</p>
      </div>

      <div className="mt-6 flex space-x-2">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          {t("common.back")}
        </button>
        <Link to={`/patient/prescriptions/${record.id}`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {t("medicalRecord.viewPrescription")}
        </Link>
      </div>
    </div>
  )
}

export default MedicalRecordDetailPage
