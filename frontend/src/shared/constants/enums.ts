export const Gender = {
    MALE: "MALE",
    FEMALE: "FEMALE",
    OTHER: "OTHER"
  } as const;
  export type Gender = typeof Gender[keyof typeof Gender];
  
  export const BloodType = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-"
  } as const;
  export type BloodType = typeof BloodType[keyof typeof BloodType];
  
  export const Relationship = {
    FAMILY: "FAMILY",
    FRIEND: "FRIEND",
    OTHERS: "OTHERS"
  } as const;
  export type Relationship = typeof Relationship[keyof typeof Relationship];
  

  export const DoctorType = {
    EXAMINATION: "EXAMINATION",
    SERVICE: "SERVICE"
  } as const;
  export type DoctorType = typeof DoctorType[keyof typeof DoctorType];
  
  // Academic Degree
  export const AcademicDegree = {
    BS: "BS",
    BS_CKI: "BS_CKI",
    BS_CKII: "BS_CKII",
    THS_BS: "THS_BS",
    TS_BS: "TS_BS",
    PGS_TS_BS: "PGS_TS_BS",
    GS_TS_BS: "GS_TS_BS"
  } as const;
  export type AcademicDegree = typeof AcademicDegree[keyof typeof AcademicDegree];
  
  // Academic Degree Labels (for display)
  export const ACADEMIC_DEGREE_LABELS: Record<AcademicDegree, string> = {
    BS: "BS",
    BS_CKI: "BS CKI",
    BS_CKII: "BS CKII",
    THS_BS: "ThS.BS",
    TS_BS: "TS.BS",
    PGS_TS_BS: "PGS.TS.BS",
    GS_TS_BS: "GS.TS.BS"
  };

  export const UserRole = {
    ADMIN: "A",
    PATIENT: "P",
    DOCTOR: "D",
    RECEPTIONIST: "RECEPTIONIST"
  } as const;
  
  export type UserRole = typeof UserRole[keyof typeof UserRole];
  