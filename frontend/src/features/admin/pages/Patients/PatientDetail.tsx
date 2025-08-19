"use client"

import { useParams } from "react-router"
import PageMeta from "../../components/common/PageMeta"
import { PatientDetailLayout } from "../../components/sections/patient"
import ReturnButton from "../../components/ui/button/ReturnButton"
import { useEffect, useState } from "react"
import { patientService } from "../../services/patientService"
import type { Patient } from "../../types/patient"
import { useTranslation } from "react-i18next";

export default function PatientDetail() {
  const { t } = useTranslation();
  const { patientId } = useParams<{ patientId: string }>()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) {
        setError(t("patientDetail.page.error.notFoundId"))
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const fetchedPatient = await patientService.getPatientById(Number(patientId))
        setPatient(fetchedPatient)
      } catch (err: any) {
        console.error("Failed to fetch patient details:", err)
        setError(err.message || t("patientDetail.page.error.loadFailed"))
        setPatient(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [patientId])

  return (
    <>
      <PageMeta title={t("patientDetail.page.metaTitle")} description={t("patientDetail.page.metaDescription")} />

      <div className="flex justify-start items-center mb-6">
        <ReturnButton />
        <h3 className="font-semibold tracking-tight">
          {t("patientDetail.page.patient")}: {patient?.fullName || (loading ? t("common.loading") : t("common.notFound"))}
        </h3>
      </div>

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-base-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("patientDetail.page.loading")}</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-10 text-red-600">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && patient && <PatientDetailLayout patient={patient} />}
    </>
  )
}
