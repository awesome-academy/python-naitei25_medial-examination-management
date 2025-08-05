"use client"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

export const Header = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const navigation = [
    { name: t("navigation.home"), href: "#" },
    { name: t("navigation.findDoctor"), href: "#" },
    { name: t("navigation.apps"), href: "#" },
    { name: t("navigation.testimonials"), href: "#" },
    { name: t("navigation.aboutUs"), href: "#" },
  ]

  const handleLogin = () => {
    navigate("/auth/patient-login")
  }

  const handleRegister = () => {
    navigate("/auth/register")
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Trafalgar</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-10">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 font-medium" onClick={handleLogin}>
              {t("auth.login")}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6" onClick={handleRegister}>
              {t("auth.register")}
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-6 mt-8">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-blue-600 transition-colors py-2 font-medium"
                  >
                    {item.name}
                  </a>
                ))}
                <div className="flex flex-col space-y-3 pt-4 border-t">
                  <Button variant="ghost" className="text-blue-600 justify-start w-full" onClick={handleLogin}>
                    {t("auth.login")}
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full" onClick={handleRegister}>
                    {t("auth.register")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
