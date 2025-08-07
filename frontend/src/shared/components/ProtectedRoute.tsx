"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole: string }> = ({ children, requiredRole }) => {
  const { t } = useTranslation()
  const { isAuthenticated, hasRole } = useAuth()

  if (!isAuthenticated || !hasRole(requiredRole)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
