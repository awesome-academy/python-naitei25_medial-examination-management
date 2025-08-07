import type React from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
} from "../../assets/icons";
import { useSidebar } from "../context/SidebarContext";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const role = localStorage.getItem("authRole") || "";
  const doctorType = localStorage.getItem("doctorType") || "";

  // Cập nhật basePath để khớp với routing structure
  const basePath =
    role === "RECEPTIONIST"
      ? "/receptionist"
      : role === "D"
        ? `/doctor/${doctorType === "E"
          ? "examination"
          : doctorType === "S"
            ? "service"
            : ""
        }`
        : role === "P"
          ? "/patient"
          : "/admin";

  const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: t("sidebar.overview"),
      path: `${basePath}/dashboard`,
      roles: ["A", "RECEPTIONIST", "D", "P"],
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
        {
          name: t("sidebar.calendar"),
          path: `${basePath}/calendar`,
          pro: false,
        },
        {
          name: t("sidebar.outpatientClinics"),
          path: `${basePath}/outpatient-clinics`,
          pro: false,
        },
      ],
      roles: ["A", "RECEPTIONIST"],
    },
    // {
    //   name: t("sidebar.inpatient"),
    //   icon: <InpatientIcon />,
    //   subItems: [
    //     {
    //       name: t("sidebar.inpatientRooms"),
    //       path: `${basePath}/inpatients-rooms`,
    //       pro: false,
    //     },
    //     {
    //       name: t("sidebar.inpatientPatients"),
    //       path: `${basePath}/inpatients`,
    //       pro: false,
    //     },
    //   ],
    //   roles: ["A", "RECEPTIONIST"],
    // },
    // {
    //   icon: <DepartmentIcon />,
    //   name: t("sidebar.departments"),
    //   path: `${basePath}/departments`,
    //   roles: ["A", "RECEPTIONIST"],
    // },
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
    // {
    //   icon: <CalendarIcon />,
    //   name: t("sidebar.medicines"),
    //   path: `${basePath}/medicines`,
    //   roles: ["A"],
    // },
    // {
    //   icon: <BoxCubeIcon />,
    //   name: t("sidebar.healthServices"),
    //   path: `${basePath}/health-services`,
    //   roles: ["A"],
    // },
    {
      icon: <CalendarIcon />,
      name: t("sidebar.workSchedule"),
      path: `${basePath}/schedule`,
      roles: ["D"],
    },
    {
      icon: <CalendarIcon />,
      name: t("sidebar.bookAppointment"),
      path: `${basePath}/book-appointment`,
      roles: ["P"],
    },
    {
      name: t("sidebar.appointments"),
      icon: <CalendarIcon />,
      subItems: [
        {
          name: t("sidebar.upcomingAppointments"),
          path: `${basePath}/appointments/upcoming`,
        },
        {
          name: t("sidebar.pastAppointments"),
          path: `${basePath}/appointments/past`,
        },
      ],
      roles: ["P"],
    },
    {
      icon: <BoxCubeIcon />,
      name: t("sidebar.prescriptions"),
      path: `${basePath}/prescriptions`,
      roles: ["P"],
    },
    {
      name: t("sidebar.lookup"),
      icon: <DoctorIcon />,
      subItems: [
        {
          name: t("sidebar.drugLookup"),
          path: `${basePath}/drug-lookup`,
          pro: false,
        },
        {
          name: t("sidebar.aiDiagnosis"),
          path: `${basePath}/ai-diagnosis`,
          pro: false,
          new: true,
        },
      ],
      roles: ["P"],
    },
    // Profile item - khớp với PatientApp
    {
      icon: <UserCircleIcon />,
      name: t("sidebar.account"),
      path: `${basePath}/profile`,
      roles: ["A", "RECEPTIONIST", "D", "P"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => item.roles && item.roles.includes(role)
  );

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      // Xử lý đặc biệt cho dashboard route
      if (path.endsWith("/dashboard")) {
        return location.pathname === path;
      }

      // Xử lý cho các route khác
      if (path === basePath) {
        return location.pathname === path;
      }
      return (
        location.pathname === path || location.pathname.startsWith(path + "/")
      );
    },
    [location.pathname, basePath]
  );

  // Đơn giản hóa useEffect để chỉ xử lý auto-open submenu khi có route active
  useEffect(() => {
    let activeSubmenuIndex: number | null = null;

    // Tìm submenu có item active
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            activeSubmenuIndex = index;
          }
        });
      }
    });

    // Chỉ set submenu active nếu tìm thấy
    if (activeSubmenuIndex !== null) {
      setOpenSubmenu(activeSubmenuIndex);
    }
  }, [location.pathname, filteredNavItems, isActive]);

  // Tính toán chiều cao submenu
  useEffect(() => {
    if (openSubmenu !== null) {
      if (subMenuRefs.current[openSubmenu]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    console.log("Toggle submenu:", index, "Current open:", openSubmenu); // Debug log
    setOpenSubmenu((prevOpen) => {
      // Nếu đang mở cùng submenu thì đóng, nếu không thì mở submenu mới
      return prevOpen === index ? null : index;
    });
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <>
              <button
                onClick={() => handleSubmenuToggle(index)}
                className={`menu-item group ${openSubmenu === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                  } cursor-pointer w-full ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${openSubmenu === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text">{nav.name}</span>
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu === index ? "rotate-180 text-white" : ""
                        }`}
                    />
                  </>
                )}
              </button>
              {/* Submenu */}
              {(isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[index] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height:
                      openSubmenu === index
                        ? `${subMenuHeight[index]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                            }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                  } menu-dropdown-badge`}
                              >
                                {t("sidebar.new")}
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
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
            </>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen || isHovered ? "w-[250px]" : "w-[90px]"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to={basePath}>
          <img
            src="/public/images/logo/Logo.png"
            alt="Wecare Logo"
            className={`transition-all duration-300 ${isExpanded || isHovered || isMobileOpen ? "w-32" : "w-10"
              }`}
          />
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                  }`}
              >
                {(isExpanded || isHovered || isMobileOpen) && t("sidebar.menu")}
                {!isExpanded && !isHovered && !isMobileOpen && (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
