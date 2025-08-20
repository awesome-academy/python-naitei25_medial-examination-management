"use client"

import { Award, Users, Heart, Shield, Clock, Star, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function AboutPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const stats = [
    { icon: Users, number: "500+", label: t("about.stats.doctors"), color: "text-teal-600" },
    { icon: Heart, number: "50,000+", label: t("about.stats.patients"), color: "text-red-500" },
    { icon: Award, number: "25+", label: t("about.stats.departments"), color: "text-green-600" },
    { icon: Star, number: "4.8/5", label: t("about.stats.rating"), color: "text-yellow-500" },
  ]

  const values = [
    { icon: Heart, title: t("about.values.dedication.title"), description: t("about.values.dedication.desc") },
    { icon: Shield, title: t("about.values.safety.title"), description: t("about.values.safety.desc") },
    { icon: Award, title: t("about.values.professional.title"), description: t("about.values.professional.desc") },
    { icon: Clock, title: t("about.values.convenience.title"), description: t("about.values.convenience.desc") },
  ]

  const milestones = [
    { year: "2020", title: t("about.timeline.2020.title"), description: t("about.timeline.2020.desc") },
    { year: "2021", title: t("about.timeline.2021.title"), description: t("about.timeline.2021.desc") },
    { year: "2022", title: t("about.timeline.2022.title"), description: t("about.timeline.2022.desc") },
    { year: "2023", title: t("about.timeline.2023.title"), description: t("about.timeline.2023.desc") },
    { year: "2024", title: t("about.timeline.2024.title"), description: t("about.timeline.2024.desc") },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white mb-12">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("about.header.title")}</h1>
          <p className="text-lg text-teal-100 mb-6">{t("about.header.subtitle")}</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 group-hover:bg-gray-100 transition-colors mb-4 ${stat.color}`}
                >
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t("about.mission.title")}</h2>
              <p className="text-lg text-gray-600 leading-relaxed">{t("about.mission.desc")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{t("about.vision.title")}</h3>
                <div className="space-y-4">
                  {t("about.vision.points", { returnObjects: true }).map((point: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-teal-600 mt-1 flex-shrink-0" />
                      <p className="text-gray-700">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-10 w-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">{t("about.commitment.title")}</h4>
                  <p className="text-gray-600">{t("about.commitment.desc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t("about.values.title")}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("about.values.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white mb-6">
                  <value.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t("about.timeline.title")}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("about.timeline.subtitle")}</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-teal-200"></div>
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative flex items-center mb-12 ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}>
                    <Card className="p-6 shadow-lg border-0">
                      <div className="text-2xl font-bold text-teal-600 mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </Card>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-teal-600 rounded-full border-4 border-white shadow-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
