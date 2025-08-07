import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  GridIcon,
  CalendarIcon,
  ChevronDownIcon,
  HorizontaLDots,
  UserCircleIcon,
  PatientIcon,
  InpatientIcon,
  DepartmentIcon,
  AdminIcon,
  DoctorIcon,
  BoxCubeIcon,
} from "../../assets/icons"
import { useSidebar } from "../context/SidebarContext"
import LanguageSwitcher from "../components/common/LanguageSwitcher"

type NavItem = {
  name: string
  icon: React.ReactNode
  path?: string
  roles?: string[]
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[]
}

const AppSidebar: React.FC = () => {
  const { t } = useTranslation()
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar()
  const location = useLocation()
  const role = localStorage.getItem("authRole") || ""
  const doctorType = localStorage.getItem("doctorType") || ""
  const basePath =
    role === "RECEPTIONIST"
      ? "/receptionist"
      : role === "D"
        ? `/doctor/${doctorType === "E" ? "examination" : doctorType === "S" ? "service" : ""}`
        : "/admin"

  const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: t("sidebar.overview"),
      path: `${basePath}/dashboard`,
      roles: ["A", "RECEPTIONIST", "D"],
    },
    {
      icon: <PatientIcon />,
      name: t("sidebar.patients"),
      path: `${basePath}/patients`,
      roles: ["A", "RECEPTIONIST", "D"], // Chỉ hiển thị cho bác sĩ loại E
    },
    {
      name: t("sidebar.examination"),
      icon: <CalendarIcon />,
      subItems: [
        { name: t("sidebar.calendar"), path: `${basePath}/calendar`, pro: false },
        { name: t("sidebar.outpatientClinics"), path: `${basePath}/outpatient-clinics`, pro: false },
      ],
      roles: ["A", "RECEPTIONIST"],
    },
    {
      name: t("sidebar.inpatient"),
      icon: <InpatientIcon />,
      subItems: [
        { name: t("sidebar.inpatientRooms"), path: `${basePath}/inpatients-rooms`, pro: false },
        { name: t("sidebar.inpatientPatients"), path: `${basePath}/inpatients`, pro: false },
      ],
      roles: ["A", "RECEPTIONIST"],
    },
    {
      icon: <DepartmentIcon />,
      name: t("sidebar.departments"),
      path: `${basePath}/departments`,
      roles: ["A", "RECEPTIONIST"],
    },
    {
      icon: <AdminIcon />,
      name: t("sidebar.authorization"),
      path: `${basePath}/authorization`,
      roles: ["A"],
    },
    {
      icon: <DoctorIcon />,
      name: t("sidebar.doctors"),
      path: `${basePath}/doctors`,
      roles: ["A"],
    },
    {
      icon: <CalendarIcon />,
      name: t("sidebar.medicines"),
      path: `${basePath}/medicines`,
      roles: ["A"],
    },
    {
      icon: <BoxCubeIcon />,
      name: t("sidebar.healthServices"),
      path: `${basePath}/health-services`,
      roles: ["A"],
    },
    {
      icon: <CalendarIcon />,
      name: t("sidebar.workSchedule"),
      path: `${basePath}/schedule`,
      roles: ["D"],
    },
    {
      icon: <UserCircleIcon />,
      name: t("sidebar.account"),
      path: `${basePath}/profile`,
      roles: ["A", "RECEPTIONIST", "D"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => item.roles && item.roles.includes(role))

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others"
    index: number
  } | null>(null)
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({})
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const isActive = useCallback(
    (path: string) => {
      if (path === basePath) {
        return location.pathname === path
      }
      return location.pathname === path || location.pathname.startsWith(path + "/")
    },
    [location.pathname, basePath],
  )

  useEffect(() => {
    let submenuMatched = false
    ;["main"].forEach((menuType) => {
      const items = navItems
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              })
              submenuMatched = true
            }
          })
        }
      })
    })

    if (!submenuMatched) {
      setOpenSubmenu(null)
    }
  }, [location, isActive])

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }))
      }
    }
  }, [openSubmenu])

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu && prevOpenSubmenu.type === menuType && prevOpenSubmenu.index === index) {
        return null
      }
      return { type: menuType, index }
    })
  }

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items
        .filter((nav) => nav.roles?.includes(role || ""))
        .map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span
                  className={`menu-item-icon-size ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index ? "rotate-180 text-white" : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              {t("sidebar.new")}
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              {t("sidebar.pro")}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
    </ul>
  )

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen || isHovered ? "w-[250px]" : "w-[90px]"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to={basePath}>
          <img
            src="/public/images/logo/Logo.png"
            alt="Wecare Logo"
            className={`transition-all duration-300 ${isExpanded || isHovered || isMobileOpen ? "w-32" : "w-10"}`}
          />
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {(isExpanded || isHovered || isMobileOpen) && t("sidebar.menu")}
                {!isExpanded && !isHovered && !isMobileOpen && <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}

export default AppSidebar
