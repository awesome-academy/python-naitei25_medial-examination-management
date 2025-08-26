"use client"

import { useTranslation } from "react-i18next"
import AccountInfo from "../../components/AccountInfo"

function Profile() {
  const { t } = useTranslation()

  return (
    <div style={{ minHeight: "100vh" }}>
      <div>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#111827",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            {t("navigation.accountAndSecurity")}
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>
            {t("navigation.managePersonalInfo")}
          </p>
        </div>

        {/* Content - Direct rendering without Tabs */}
        <AccountInfo />
      </div>
    </div>
  )
}

export default Profile