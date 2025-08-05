"use client"
import { useTranslation } from "react-i18next"

export const Footer = () => {
  const { t } = useTranslation()

  return (
    <footer className="bg-blue-600 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold">Trafalgar</span>
            </div>
            <p className="text-blue-100">{t("hero.description")}</p>
            <p className="text-blue-100 text-sm">{t("footer.copyright")}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("footer.company.title")}</h3>
            <ul className="space-y-2 text-blue-100">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.company.about")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.company.testimonials")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.company.findDoctor")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.company.apps")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("footer.region.title")}</h3>
            <ul className="space-y-2 text-blue-100">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.region.indonesia")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.region.singapore")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.region.hongkong")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.region.canada")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t("footer.help.title")}</h3>
            <ul className="space-y-2 text-blue-100">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.help.helpCenter")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.help.contactSupport")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.help.instructions")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.help.howItWorks")}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
