"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Save, X } from "lucide-react"
import { useToast } from "../../../hooks/useToast"
import { patientService } from "../../../../../shared/services/patientService"
import { useTranslation } from "react-i18next"

interface PersonalInfo {
  id: number
  first_name: string
  last_name: string
  birthday: string
  gender: string
  address: string
  avatar?: string
  identity_number: string
  phone: string
  email: string
  city: string
  district: string
  ward: string
}

export function PersonalInfoTab() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState("basic")
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    id: 0,
    first_name: "",
    last_name: "",
    birthday: "",
    gender: "",
    address: "",
    avatar: "",
    identity_number: "",
    phone: "",
    email: "",
    city: "",
    district: "",
    ward: "",
  })
  const [originalInfo, setOriginalInfo] = useState<PersonalInfo>(personalInfo)
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    loadPersonalInfo()
  }, [])

  const loadPersonalInfo = async () => {
    try {
      setLoading(true)
      const patient = await patientService.getCurrentPatient()
      const personalData: PersonalInfo = {
        id: patient.id,
        first_name: patient.first_name || "",
        last_name: patient.last_name || "",
        birthday: patient.birthday || "",
        gender: patient.gender || "",
        address: patient.address || "",
        avatar: patient.avatar || "",
        identity_number: patient.identity_number || "",
        phone: patient.phone || "",
        email: patient.email || "",
        city: "",
        district: "",
        ward: "",
      }
      setPersonalInfo(personalData)
      setOriginalInfo(personalData)
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("personalInfo.loadError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      const updateData = {
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        birthday: personalInfo.birthday,
        gender: personalInfo.gender as "M" | "F" | "O",
        address: personalInfo.address,
        identity_number: personalInfo.identity_number,
      }

      const updated = await patientService.updatePatient(
        personalInfo.id.toString(),
        updateData
      )

      setPersonalInfo(updated)
      setOriginalInfo(updated)
      setIsEditing(false)
      toast({
        title: t("common.success"),
        description: t("personalInfo.updateSuccess"),
      })
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("personalInfo.updateError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setPersonalInfo(originalInfo)
    setIsEditing(false)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!personalInfo.id || personalInfo.id <= 0) {
      toast({
        title: t("common.error"),
        description: t("personalInfo.invalidPatient"),
        variant: "destructive",
      })
      return
    }

    if (file) {
      try {
        setLoading(true)
        const result = await patientService.uploadAvatar(personalInfo.id.toString(), file)
        setPersonalInfo((prev) => ({
          ...prev,
          avatar: result.avatar,
        }))

        toast({
          title: t("common.success"),
          description: t("personalInfo.avatarUpdated"),
        })
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("personalInfo.avatarUploadError"),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("personalInfo.title")}</CardTitle>
        <CardDescription>{t("personalInfo.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <div className="">
            {isEditing ? (
              <div className="flex justify-end gap-2">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" /> {t("common.save")}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  <X className="mr-2 h-4 w-4" /> {t("common.cancel")}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} disabled={loading}>
                <Edit className="mr-2 h-4 w-4" /> {t("common.edit")}
              </Button>
            )}
          </div>
          {activeSubTab === "basic" && (
            <div className="grid gap-4 py-4">
              {/* Avatar */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avatar" className="text-right">{t("personalInfo.avatar")}</Label>
                <div className="col-span-3">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={personalInfo.avatar} alt="Avatar" />
                    <AvatarFallback>
                      {personalInfo.first_name.charAt(0)}{personalInfo.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={loading}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              {/* Basic fields */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right">{t("personalInfo.firstName")}</Label>
                <Input
                  id="first_name"
                  value={personalInfo.first_name}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, first_name: e.target.value })
                  }
                  disabled={!isEditing || loading}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right">{t("personalInfo.lastName")}</Label>
                <Input
                  id="last_name"
                  value={personalInfo.last_name}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, last_name: e.target.value })
                  }
                  disabled={!isEditing || loading}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="birthday" className="text-right">{t("personalInfo.birthday")}</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={personalInfo.birthday}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, birthday: e.target.value })
                  }
                  disabled={!isEditing || loading}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">{t("personalInfo.gender")}</Label>
                <Select
                  value={personalInfo.gender}
                  onValueChange={(value) =>
                    setPersonalInfo({ ...personalInfo, gender: value })
                  }
                  disabled={!isEditing || loading}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t("personalInfo.selectGender")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">{t("personalInfo.male")}</SelectItem>
                    <SelectItem value="F">{t("personalInfo.female")}</SelectItem>
                    <SelectItem value="O">{t("personalInfo.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="identity_number" className="text-right">{t("personalInfo.identityNumber")}</Label>
                <Input
                  id="identity_number"
                  value={personalInfo.identity_number}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, identity_number: e.target.value })
                  }
                  disabled={!isEditing || loading}
                  className="col-span-3"
                />
              </div>

              {/* Address moved here */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">{t("personalInfo.address")}</Label>
                <Textarea
                  id="address"
                  value={personalInfo.address}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, address: e.target.value })
                  }
                  disabled={!isEditing || loading}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
