export const LocalStorageKeys = {
  AUTH_TOKEN: "authToken",
  AUTH_USER: "authUser",
  AUTH_ROLE: "authRole",
  CURRENT_USER_ID: "currentUserId",
  CURRENT_DOCTOR_ID: "currentDoctorId",
  DOCTOR_INFO: "doctorInfo",
  ADMIN_INFO: "adminInfo",
  RECEPTIONIST_INFO: "receptionistInfo",
  DOCTOR_TYPE: 'doctorType',
  LANGUAGE: "language",
  LOCALE: "locale",
} as const;

export type LocalStorageKey = typeof LocalStorageKeys[keyof typeof LocalStorageKeys];