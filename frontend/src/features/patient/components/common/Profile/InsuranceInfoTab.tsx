"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Edit, Save, X, Shield, CreditCard } from "lucide-react"
import { useToast } from "../../../hooks/useToast"
import { patientService } from "../../../../../shared/services/patientService"
import { useTranslation } from "react-i18next"

interface SocialInsurance {
  insurance_number: string
  insurance_expiry: string
}

export function InsuranceInfoTab() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialInsurance, setSocialInsurance] = useState<SocialInsurance>({
    insurance_number: "",
    insurance_expiry: "",
  })
  const [originalSocial, setOriginalSocial] = useState<SocialInsurance>({
    insurance_number: "",
    insurance_expiry: "",
  })
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    loadInsuranceInfo()
  }, [])

  const loadInsuranceInfo = async () => {
    try {
      setLoading(true)
      const patient = await patientService.getCurrentPatient()

      const socialData: SocialInsurance = {
        insurance_number: patient.insurance_number || "",
        insurance_expiry: (patient as any).insurance_expiry || "",
      }

      setSocialInsurance(socialData)
      setOriginalSocial(socialData)
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("insurance.loadError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await patientService.updateProfile({
        insurance_number: socialInsurance.insurance_number,
        insurance_expiry: socialInsurance.insurance_expiry,
      })

      setOriginalSocial(socialInsurance)
      setIsEditing(false)
      toast({
        title: t("common.success"),
        description: t("insurance.updateSuccess"),
      })
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("insurance.updateError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setSocialInsurance(originalSocial)
    setIsEditing(false)
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            {t("insurance.title")}
          </CardTitle>
          <CardDescription>{t("insurance.description")}</CardDescription>
        </div>
        <div className="flex gap-2 mt-4">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={loading}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? t("common.saving") : t("common.save")}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                {t("common.cancel")}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t("common.edit")}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading && !isEditing && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Thẻ bảo hiểm hiển thị */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <CreditCard className="w-8 h-8" />
                <div className="text-right">
                  <p className="text-sm opacity-90">{t("insurance.cardTitle")}</p>
                  <p className="text-xs opacity-75">{t("insurance.country")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-mono tracking-wider">
                  {socialInsurance.insurance_number || "•••• •••• ••••"}
                </p>
              </div>
            </div>

            {/* Form chỉnh sửa bảo hiểm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="social_insurance_number">
                  {t("insurance.insuranceNumber")}
                </Label>
                <Input
                  id="social_insurance_number"
                  value={socialInsurance.insurance_number}
                  onChange={(e) =>
                    setSocialInsurance((prev) => ({
                      ...prev,
                      insurance_number: e.target.value,
                    }))
                  }
                  disabled={!isEditing || loading}
                  className="bg-white font-mono"
                  placeholder={t("insurance.enterInsuranceNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_expiry_date">
                  {t("insurance.expiryDate")}
                </Label>
                <Input
                  id="social_expiry_date"
                  type="date"
                  value={socialInsurance.insurance_expiry}
                  onChange={(e) =>
                    setSocialInsurance((prev) => ({
                      ...prev,
                      insurance_expiry: e.target.value,
                    }))
                  }
                  disabled={!isEditing || loading}
                  className="bg-white"
                />
              </div>
            </div>

            {/* Trạng thái bảo hiểm */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Shield className="w-5 h-5" />
                <span className="font-medium">
                  {t("insurance.socialStatus")}:{" "}
                  {socialInsurance.insurance_number
                    ? t("insurance.active")
                    : t("insurance.notUpdated")}
                </span>
              </div>
              {socialInsurance.insurance_expiry && (
                <p className="text-sm text-green-600 mt-1">
                  {t("insurance.validUntil", {
                    date: socialInsurance.insurance_expiry,
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
