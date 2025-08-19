"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Phone, User, Heart, Stethoscope, Users } from "lucide-react"
import { useToast } from "../../../hooks/useToast"
import { patientService } from "../../../../../shared/services/patientService"
import type { EmergencyContact } from "../../../../../shared/types/patient"
import { useTranslation } from "react-i18next"

interface EmergencyContactWithCategory extends EmergencyContact {
  category: "family" | "medical"
}

export function EmergencyContactTab() {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<EmergencyContactWithCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContactWithCategory | null>(null)
  const [activeSubTab, setActiveSubTab] = useState("family")
  const [formData, setFormData] = useState<EmergencyContactWithCategory>({
    id: 0,
    patient_id: 0,
    contact_name: "",
    contact_phone: "",
    relationship: "",
    category: "family",
    created_at: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadEmergencyContacts()
  }, [])

  const loadEmergencyContacts = async () => {
    try {
      setLoading(true)
      const patient = await patientService.getCurrentPatient()
      const contactsData = await patientService.getEmergencyContacts(patient.id)

      const contactsWithCategory: EmergencyContactWithCategory[] = contactsData.map((contact) => ({
        ...contact,
        category: getMedicalRelationships().includes(contact.relationship) ? "medical" : "family",
      }))

      setContacts(contactsWithCategory)
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("emergency.loadError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getMedicalRelationships = () => [
    t("emergency.relationships.familyDoctor"),
    t("emergency.relationships.specialist"),
    t("emergency.relationships.pharmacist"),
    t("emergency.relationships.nurse"),
  ]

  const handleSave = async () => {
    try {
      setLoading(true)
      const patient = await patientService.getCurrentPatient()

      if (editingContact && editingContact.id) {
        const updatedContact = await patientService.updateEmergencyContact(patient.id, editingContact.id, {
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          relationship: formData.relationship,
        })

        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === editingContact.id ? { ...updatedContact, category: formData.category } : contact,
          ),
        )
        toast({
          title: t("common.success"),
          description: t("emergency.updateSuccess"),
        })
      } else {
        const newContact = await patientService.addEmergencyContact(patient.id, {
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          relationship: formData.relationship,
        })

        setContacts((prev) => [...prev, { ...newContact, category: formData.category }])
        toast({
          title: t("common.success"),
          description: t("emergency.addSuccess"),
        })
      }

      handleCloseDialog()
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("emergency.saveError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (contactId: number) => {
    try {
      const patient = await patientService.getCurrentPatient()
      await patientService.deleteEmergencyContact(patient.id, contactId)

      setContacts((prev) => prev.filter((contact) => contact.id !== contactId))
      toast({
        title: t("common.success"),
        description: t("emergency.deleteSuccess"),
      })
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("emergency.deleteError"),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (contact: EmergencyContactWithCategory) => {
    setEditingContact(contact)
    setFormData(contact)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingContact(null)
    setFormData({
      id: 0,
      patient_id: 0,
      contact_name: "",
      contact_phone: "",
      relationship: "",
      category: "family",
      created_at: "",
    })
  }

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case t("emergency.relationships.spouse").toLowerCase():
      case "spouse":
        return <Heart className="w-4 h-4 text-red-500" />
      case t("emergency.relationships.child").toLowerCase():
      case "child":
        return <User className="w-4 h-4 text-blue-500" />
      case t("emergency.relationships.familyDoctor").toLowerCase():
      case "doctor":
        return <Stethoscope className="w-4 h-4 text-green-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const familyContacts = contacts.filter((contact) => contact.category === "family")
  const medicalContacts = contacts.filter((contact) => contact.category === "medical")

  const renderContactList = (contactList: EmergencyContactWithCategory[], emptyMessage: string) => {
    if (contactList.length === 0) {
      return (
        <div className="text-center py-12">
          <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-red-600 hover:bg-red-700" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            {t("emergency.add")}
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {contactList.map((contact) => (
          <div
            key={contact.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getRelationshipIcon(contact.relationship)}
                <div>
                  <h4 className="font-medium text-gray-900">{contact.contact_name}</h4>
                  <p className="text-sm text-gray-500">{contact.relationship}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-4">
                  <p className="font-mono text-sm text-gray-900">{contact.contact_phone}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit(contact)} disabled={loading}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(contact.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-600" />
            {t("emergency.title")}
          </CardTitle>
          <CardDescription>{t("emergency.description")}</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              {t("emergency.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingContact ? t("emergency.edit") : t("emergency.create")}</DialogTitle>
              <DialogDescription>{t("emergency.formDescription")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_category">{t("emergency.contactType")}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "family" | "medical") =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("emergency.chooseContactType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">{t("emergency.family")}</SelectItem>
                    <SelectItem value="medical">{t("emergency.medical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">{t("emergency.contactName")}</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
                  placeholder={t("emergency.enterName") || ""}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">{t("emergency.contactPhone")}</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder={t("emergency.enterPhone") || ""}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">{t("emergency.relationship")}</Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, relationship: value }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("emergency.chooseRelationship")} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category === "family" ? (
                      <>
                        <SelectItem value={t("emergency.relationships.spouse")}>
                          {t("emergency.relationships.spouse")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.child")}>
                          {t("emergency.relationships.child")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.parent")}>
                          {t("emergency.relationships.parent")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.sibling")}>
                          {t("emergency.relationships.sibling")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.friend")}>
                          {t("emergency.relationships.friend")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.other")}>
                          {t("emergency.relationships.other")}
                        </SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value={t("emergency.relationships.familyDoctor")}>
                          {t("emergency.relationships.familyDoctor")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.specialist")}>
                          {t("emergency.relationships.specialist")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.pharmacist")}>
                          {t("emergency.relationships.pharmacist")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.nurse")}>
                          {t("emergency.relationships.nurse")}
                        </SelectItem>
                        <SelectItem value={t("emergency.relationships.other")}>
                          {t("emergency.relationships.other")}
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} disabled={loading}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? t("common.saving") : editingContact ? t("common.update") : t("common.add")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        )}

        {!loading && (
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 mb-6">
              <TabsTrigger value="family" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("emergency.family")} ({familyContacts.length})
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                {t("emergency.medical")} ({medicalContacts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="family">
              {renderContactList(familyContacts, t("emergency.emptyFamily"))}
            </TabsContent>

            <TabsContent value="medical">
              {renderContactList(medicalContacts, t("emergency.emptyMedical"))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
