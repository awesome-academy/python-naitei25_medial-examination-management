"use client"

import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ContactPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: t("contact.info.address.title"),
      details: t("contact.info.address.details", { returnObjects: true }) as string[],
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      icon: Phone,
      title: t("contact.info.phone.title"),
      details: t("contact.info.phone.details", { returnObjects: true }) as string[],
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Mail,
      title: t("contact.info.email.title"),
      details: t("contact.info.email.details", { returnObjects: true }) as string[],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Clock,
      title: t("contact.info.workingHours.title"),
      details: t("contact.info.workingHours.details", { returnObjects: true }) as string[],
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  const services = [
    {
      icon: MessageCircle,
      title: t("contact.services.items.consultation.title"),
      description: t("contact.services.items.consultation.desc"),
      action: t("contact.services.items.consultation.action"),
    },
    {
      icon: Calendar,
      title: t("contact.services.items.appointment.title"),
      description: t("contact.services.items.appointment.desc"),
      action: t("contact.services.items.appointment.action"),
    },
    {
      icon: Users,
      title: t("contact.services.items.support.title"),
      description: t("contact.services.items.support.desc"),
      action: t("contact.services.items.support.action"),
    },
  ]

  const faqs = t("contact.faq.items", { returnObjects: true }) as { q: string; a: string }[]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white mb-12">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("contact.header.title")}</h1>
          <p className="text-lg text-teal-100 mb-6">{t("contact.header.subtitle")}</p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${info.bgColor} mb-4`}>
                  <info.icon className={`h-8 w-8 ${info.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{info.title}</h3>
                <div className="space-y-1">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm">
                      {detail}
                    </p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">{t("contact.form.title")}</CardTitle>
                  <p className="text-gray-600">{t("contact.form.desc")}</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">{t("contact.form.fields.name")}</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder={t("contact.form.placeholders.name")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">{t("contact.form.fields.phone")}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder={t("contact.form.placeholders.phone")}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">{t("contact.form.fields.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder={t("contact.form.placeholders.email")}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">{t("contact.form.fields.subject")}</Label>
                      <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("contact.form.placeholders.subject")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">{t("contact.form.subjects.appointment")}</SelectItem>
                          <SelectItem value="consultation">{t("contact.form.subjects.consultation")}</SelectItem>
                          <SelectItem value="technical">{t("contact.form.subjects.technical")}</SelectItem>
                          <SelectItem value="complaint">{t("contact.form.subjects.complaint")}</SelectItem>
                          <SelectItem value="other">{t("contact.form.subjects.other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">{t("contact.form.fields.message")}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder={t("contact.form.placeholders.message")}
                        rows={5}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                      size="lg"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {t("contact.form.submit")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Services & Map */}
            <div className="space-y-8">
              {/* Quick Services */}
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">{t("contact.services.title")}</CardTitle>
                  <p className="text-gray-600">{t("contact.services.subtitle")}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <service.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{service.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-teal-600 border-teal-600 hover:bg-teal-600 hover:text-white bg-transparent"
                          >
                            {service.action}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Map Placeholder */}
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">{t("contact.map.title")}</CardTitle>
                  <p className="text-gray-600">{t("contact.map.subtitle")}</p>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">{t("contact.map.placeholder.desc")}</p>
                      <p className="text-sm text-gray-400">{t("contact.map.placeholder.address")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("contact.faq.title")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("contact.faq.subtitle")}</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{faq.q}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("contact.cta.title")}</h2>
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">{t("contact.cta.desc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
              <Phone className="mr-2 h-4 w-4" />
              {t("contact.cta.call")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-teal-600 bg-transparent"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {t("contact.cta.chat")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
