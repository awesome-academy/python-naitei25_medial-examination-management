"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Save, X, Shield, CreditCard, Building2 } from "lucide-react"
import { useToast } from "../../../hooks/useToast"
import { patientService } from "../../../../../shared/services/patientService"
import { useTranslation } from "react-i18next"

interface SocialInsurance {
  insurance_number: string
  insurance_provider: string
  policy_type: string
  expiry_date: string
  coverage_amount: string
}

interface PrivateInsurance {
  policy_number: string
  company_name: string
  plan_name: string
  premium_amount: string
  coverage_limit: string
  expiry_date: string
}

export function InsuranceInfoTab() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState("social")
  const [socialInsurance, setSocialInsurance] = useState<SocialInsurance>({
    insurance_number: "",
    insurance_provider: "",
    policy_type: "",
    expiry_date: "",
    coverage_amount: "",
  })
  const [privateInsurance, setPrivateInsurance] = useState<PrivateInsurance>({
    policy_number: "",
    company_name: "",
    plan_name: "",
    premium_amount: "",
    coverage_limit: "",
    expiry_date: "",
  })
  const [originalSocial, setOriginalSocial] = useState<SocialInsurance>({
    insurance_number: "",
    insurance_provider: "",
    policy_type: "",
    expiry_date: "",
    coverage_amount: "",
  })
  const [originalPrivate, setOriginalPrivate] = useState<PrivateInsurance>({
    policy_number: "",
    company_name: "",
    plan_name: "",
    premium_amount: "",
    coverage_limit: "",
    expiry_date: "",
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
        insurance_number: patient.insurance_number,
        insurance_provider: t("insurance.defaultProvider"),
        policy_type: t("insurance.defaultPolicyType"),
        expiry_date: "",
        coverage_amount: "",
      }

      const privateData: PrivateInsurance = {
        policy_number: "",
        company_name: "",
        plan_name: "",
        premium_amount: "",
        coverage_limit: "",
        expiry_date: "",
      }

      setSocialInsurance(socialData)
      setPrivateInsurance(privateData)
      setOriginalSocial(socialData)
      setOriginalPrivate(privateData)
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
      await patientService.updatePatient("me", {
        insurance_number: socialInsurance.insurance_number,
      })

      setOriginalSocial(socialInsurance)
      setOriginalPrivate(privateInsurance)
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
    setPrivateInsurance(originalPrivate)
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
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={loading} size="sm" className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {loading ? t("common.saving") : t("common.save")}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={loading}>
                <X className="w-4 h-4 mr-2" />
                {t("common.cancel")}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
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
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 mb-6">
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t("insurance.social")}
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {t("insurance.private")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="space-y-6">
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
                  <p className="text-sm opacity-90">{socialInsurance.insurance_provider || t("insurance.placeholderProvider")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="social_insurance_number">{t("insurance.insuranceNumber")}</Label>
                  <Input
                    id="social_insurance_number"
                    value={socialInsurance.insurance_number}
                    onChange={(e) => setSocialInsurance((prev) => ({ ...prev, insurance_number: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white font-mono"
                    placeholder={t("insurance.enterInsuranceNumber")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_insurance_provider">{t("insurance.provider")}</Label>
                  <Input
                    id="social_insurance_provider"
                    value={socialInsurance.insurance_provider}
                    onChange={(e) => setSocialInsurance((prev) => ({ ...prev, insurance_provider: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                    placeholder={t("insurance.enterProvider")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_policy_type">{t("insurance.policyType")}</Label>
                  <Input
                    id="social_policy_type"
                    value={socialInsurance.policy_type}
                    onChange={(e) => setSocialInsurance((prev) => ({ ...prev, policy_type: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                    placeholder={t("insurance.enterPolicyType")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_expiry_date">{t("insurance.expiryDate")}</Label>
                  <Input
                    id="social_expiry_date"
                    type="date"
                    value={socialInsurance.expiry_date}
                    onChange={(e) => setSocialInsurance((prev) => ({ ...prev, expiry_date: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="social_coverage_amount">{t("insurance.coverageAmount")}</Label>
                  <Input
                    id="social_coverage_amount"
                    value={socialInsurance.coverage_amount}
                    onChange={(e) => setSocialInsurance((prev) => ({ ...prev, coverage_amount: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                    placeholder={t("insurance.enterCoverageAmount")}
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">
                    {t("insurance.socialStatus")}: {socialInsurance.insurance_number ? t("insurance.active") : t("insurance.notUpdated")}
                  </span>
                </div>
                {socialInsurance.expiry_date && (
                  <p className="text-sm text-green-600 mt-1">
                    {t("insurance.validUntil", { date: socialInsurance.expiry_date })}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="private" className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Building2 className="w-8 h-8" />
                  <div className="text-right">
                    <p className="text-sm opacity-90">{t("insurance.privateTitle")}</p>
                    <p className="text-xs opacity-75">Private Insurance</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-mono tracking-wider">
                    {privateInsurance.policy_number || "•••• •••• ••••"}
                  </p>
                  <p className="text-sm opacity-90">{privateInsurance.company_name || t("insurance.placeholderCompany")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="private_policy_number">{t("insurance.policyNumber")}</Label>
                  <Input
                    id="private_policy_number"
                    value={privateInsurance.policy_number}
                    onChange={(e) => setPrivateInsurance((prev) => ({ ...prev, policy_number: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white font-mono"
                    placeholder={t("insurance.enterPolicyNumber")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="private_company_name">{t("insurance.companyName")}</Label>
                  <Input
                    id="private_company_name"
                    value={privateInsurance.company_name}
                    onChange={(e) => setPrivateInsurance((prev) => ({ ...prev, company_name: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                    placeholder={t("insurance.enterCompanyName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="private_plan_name">{t("insurance.planName")}</Label>
                  <Input
                    id="private_plan_name"
                    value={privateInsurance.plan_name}
                    onChange={(e) => setPrivateInsurance((prev) => ({ ...prev, plan_name: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                    placeholder={t("insurance.enterPlanName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="private_premium_amount">{t("insurance.premiumAmount")}</Label>
                  <Input
                    id="private_premium_amount"
                    value={privateInsurance.premium_amount}
                    onChange={(e) => setPrivateInsurance((prev) => ({ ...prev, premium_amount: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                    placeholder={t("insurance.enterPremiumAmount")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="private_coverage_limit">{t("insurance.coverageLimit")}</Label>
                  <Input
                    id="private_coverage_limit"
                    value={privateInsurance.coverage_limit}
                    onChange={(e) => setPrivateInsurance((prev) => ({ ...prev, coverage_limit: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                    placeholder={t("insurance.enterCoverageLimit")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="private_expiry_date">{t("insurance.expiryDate")}</Label>
                  <Input
                    id="private_expiry_date"
                    type="date"
                    value={privateInsurance.expiry_date}
                    onChange={(e) => setPrivateInsurance((prev) => ({ ...prev, expiry_date: e.target.value }))}
                    disabled={!isEditing || loading}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Building2 className="w-5 h-5" />
                  <span className="font-medium">
                    {t("insurance.privateStatus")}: {privateInsurance.policy_number ? t("insurance.active") : t("insurance.notRegistered")}
                  </span>
                </div>
                {privateInsurance.expiry_date && (
                  <p className="text-sm text-blue-600 mt-1">
                    {t("insurance.validUntil", { date: privateInsurance.expiry_date })}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
