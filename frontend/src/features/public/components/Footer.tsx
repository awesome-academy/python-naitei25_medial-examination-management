import { Link } from "react-router-dom"
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react"
import { useTranslation } from "react-i18next"

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Grid 3 cột cân đối */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          
          {/* Company Info */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <img
                className="w-32 pb-8"
                src="/public/images/logo/logo-white.png"
                alt="logo"
              />
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto lg:mx-0">
              {t("footer.companyDescription", "Chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe tốt nhất...")}
            </p>
            <div className="flex justify-center lg:justify-start space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center lg:text-left">
            <h4 className="text-lg font-semibold mb-6">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">{t("navigation.home")}</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">{t("navigation.about")}</Link></li>
              <li><Link to="/doctors" className="text-gray-400 hover:text-white transition-colors">{t("sidebar.doctors")}</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">{t("navigation.contact")}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center lg:text-left">
            <h4 className="text-lg font-semibold mb-6">{t("footer.contactInfo")}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 justify-center lg:justify-start">
                <MapPin className="h-5 w-5 text-teal-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400">{t("footer.addressLine1", "Phường Linh Trung, TP. Thủ Đức")}</p>
                  <p className="text-gray-400">{t("footer.addressLine2", "TP. Hồ Chí Minh, Việt Nam")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <Phone className="h-5 w-5 text-teal-500 flex-shrink-0" />
                <p className="text-gray-400">{t("footer.phone", "+84 123 456 789")}</p>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <Mail className="h-5 w-5 text-teal-500 flex-shrink-0" />
                <p className="text-gray-400">{t("footer.email", "info@healthcare.vn")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <p className="text-gray-400 text-sm">
              © 2024 HealthCare. {t("footer.rightsReserved", "Tất cả quyền được bảo lưu.")}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                {t("footer.privacyPolicy", "Chính sách bảo mật")}
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                {t("footer.termsOfUse", "Điều khoản sử dụng")}
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
