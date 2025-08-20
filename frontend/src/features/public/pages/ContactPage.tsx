"use client";

import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  const { t } = useTranslation();
  const contactInfo = [
    {
      icon: MapPin,
      title: t("contact.info.address.title"),
      details: t("contact.info.address.details", {
        returnObjects: true,
      }) as string[],
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      icon: Phone,
      title: t("contact.info.phone.title"),
      details: t("contact.info.phone.details", {
        returnObjects: true,
      }) as string[],
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Mail,
      title: t("contact.info.email.title"),
      details: t("contact.info.email.details", {
        returnObjects: true,
      }) as string[],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Clock,
      title: t("contact.info.workingHours.title"),
      details: t("contact.info.workingHours.details", {
        returnObjects: true,
      }) as string[],
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const faqs = t("contact.faq.items", { returnObjects: true }) as {
    q: string;
    a: string;
  }[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white mb-12">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("contact.header.title")}
          </h1>
          <p className="text-lg text-teal-100 mb-6">
            {t("contact.header.subtitle")}
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card
                key={index}
                className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${info.bgColor} mb-4`}
                >
                  <info.icon className={`h-8 w-8 ${info.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {info.title}
                </h3>
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

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t("contact.faq.title")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t("contact.faq.subtitle")}
            </p>
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
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
            {t("contact.cta.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-teal-600 hover:bg-gray-100"
            >
              <Phone className="mr-2 h-4 w-4" />
              {t("contact.cta.call")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
