/**
 * Symptom relationship mapping based on actual database symptoms
 * Used for AI-powered symptom suggestions
 */
export const SYMPTOM_RELATIONSHIPS: { [key: string]: string[] } = {
  // Respiratory symptoms
  "cough": ["sore throat", "shortness of breath", "chest tightness", "fever", "fatigue", "nasal congestion"],
  "sore throat": ["cough", "fever", "difficulty in swallowing", "nasal congestion", "headache", "throat swelling"],
  "shortness of breath": ["sharp chest pain", "cough", "fatigue", "dizziness", "palpitations", "chest tightness"],
  "sharp chest pain": ["shortness of breath", "cough", "palpitations", "dizziness", "chest tightness"],
  "nasal congestion": ["sore throat", "cough", "headache", "fever", "sneezing", "sinus congestion"],
  "sneezing": ["nasal congestion", "sore throat", "headache", "coryza", "sinus congestion"],
  "chest tightness": ["shortness of breath", "sharp chest pain", "cough", "palpitations"],
  "wheezing": ["cough", "shortness of breath", "chest tightness", "difficulty breathing"],
  "difficulty breathing": ["shortness of breath", "wheezing", "chest tightness", "sharp chest pain"],
  
  // Fever and infection symptoms
  "fever": ["headache", "chills", "fatigue", "muscle pain", "nausea", "sweating"],
  "chills": ["fever", "muscle pain", "fatigue", "headache", "feeling cold"],
  "sweating": ["fever", "chills", "fatigue", "increased heart rate", "feeling hot"],
  "feeling hot": ["sweating", "fever", "chills", "feeling hot and cold"],
  "feeling cold": ["chills", "fever", "feeling hot and cold"],
  
  // Neurological symptoms
  "headache": ["fever", "nausea", "dizziness", "fatigue", "neck stiffness or tightness"],
  "dizziness": ["headache", "nausea", "fatigue", "palpitations", "shortness of breath", "fainting"],
  "fainting": ["dizziness", "weakness", "palpitations", "decreased heart rate"],
  "frontal headache": ["headache", "nausea", "dizziness", "sinus congestion"],
  
  // Gastrointestinal symptoms
  "nausea": ["vomiting", "headache", "dizziness", "sharp abdominal pain", "fatigue"],
  "vomiting": ["nausea", "sharp abdominal pain", "diarrhea", "fever", "feeling ill"],
  "sharp abdominal pain": ["nausea", "vomiting", "diarrhea", "stomach bloating", "decreased appetite"],
  "diarrhea": ["sharp abdominal pain", "nausea", "vomiting", "fever", "abdominal distention"],
  "constipation": ["sharp abdominal pain", "stomach bloating", "nausea", "abdominal distention"],
  "stomach bloating": ["sharp abdominal pain", "constipation", "nausea", "abdominal distention"],
  "decreased appetite": ["nausea", "sharp abdominal pain", "fatigue", "recent weight loss"],
  "heartburn": ["sharp abdominal pain", "nausea", "burning abdominal pain", "upper abdominal pain"],
  
  // Musculoskeletal symptoms
  "muscle pain": ["fever", "fatigue", "joint pain", "headache", "chills", "ache all over"],
  "joint pain": ["muscle pain", "joint stiffness or tightness", "joint swelling", "fatigue"],
  "back pain": ["muscle pain", "back stiffness or tightness", "leg pain", "low back pain"],
  "neck pain": ["headache", "neck stiffness or tightness", "muscle pain", "shoulder pain"],
  "low back pain": ["back pain", "muscle pain", "leg pain", "back stiffness or tightness"],
  "shoulder pain": ["neck pain", "shoulder stiffness or tightness", "arm pain", "muscle pain"],
  "knee pain": ["leg pain", "knee swelling", "knee stiffness or tightness", "joint pain"],
  "leg pain": ["back pain", "knee pain", "muscle pain", "leg weakness"],
  
  // General symptoms
  "fatigue": ["fever", "headache", "muscle pain", "shortness of breath", "dizziness", "weakness"],
  "weakness": ["fatigue", "dizziness", "muscle pain", "shortness of breath", "muscle weakness"],
  "recent weight loss": ["decreased appetite", "fatigue", "nausea", "feeling ill"],
  "weight gain": ["fluid retention", "peripheral edema", "decreased appetite"],
  "ache all over": ["muscle pain", "fatigue", "fever", "joint pain"],
  
  // Cardiovascular symptoms
  "palpitations": ["sharp chest pain", "shortness of breath", "dizziness", "sweating", "increased heart rate"],
  "increased heart rate": ["palpitations", "shortness of breath", "dizziness", "sweating"],
  "decreased heart rate": ["dizziness", "fainting", "weakness", "fatigue"],
  "irregular heartbeat": ["palpitations", "dizziness", "chest tightness", "shortness of breath"],
  
  // Skin symptoms
  "skin rash": ["itching of skin", "fever", "skin swelling", "abnormal appearing skin"],
  "itching of skin": ["skin rash", "skin dryness, peeling, scaliness, or roughness", "allergic reaction"],
  "skin swelling": ["skin rash", "allergic reaction", "peripheral edema"],
  
  // Sleep and mood symptoms
  "insomnia": ["fatigue", "headache", "anxiety and nervousness", "depression"],
  "anxiety and nervousness": ["palpitations", "shortness of breath", "sweating", "insomnia"],
  "depression": ["fatigue", "insomnia", "decreased appetite", "anxiety and nervousness"],
  
  // Eye symptoms
  "diminished vision": ["eye pain", "headache", "dizziness", "double vision"],
  "eye pain": ["headache", "diminished vision", "eye redness", "lacrimation"],
  "eye redness": ["eye pain", "lacrimation", "itchiness of eye", "foreign body sensation in eye"],
  
  // Ear symptoms
  "ear pain": ["sore throat", "fever", "diminished hearing", "ringing in ear"],
  "diminished hearing": ["ear pain", "ringing in ear", "plugged feeling in ear"],
  "ringing in ear": ["ear pain", "diminished hearing", "dizziness"],
  
  // Urinary symptoms
  "painful urination": ["frequent urination", "blood in urine", "lower abdominal pain"],
  "frequent urination": ["painful urination", "excessive urination at night", "retention of urine"],
  "blood in urine": ["painful urination", "lower abdominal pain", "kidney mass"],
};

/**
 * Common symptoms used as fallback when no specific relationships are found
 */
export const COMMON_SYMPTOMS = ["fever", "headache", "fatigue", "nausea", "cough"];
