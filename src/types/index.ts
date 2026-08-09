export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  notes: string;
  takenToday?: boolean;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  specialist: string;
  location: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface WarningSign {
  id: string;
  text: string;
  active?: boolean;
}

export interface CheckInEntry {
  date: string;
  medicationId: string;
  medicationName: string;
  taken: boolean;
  feeling?: string;
  symptoms?: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: "missed_dose" | "red_flag" | "warning";
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
  dismissed?: boolean;
}

export interface CarePlan {
  patientName: string;
  medications: Medication[];
  appointments: Appointment[];
  checklist: ChecklistItem[];
  warningSigns: WarningSign[];
  questionsForDoctor: string[];
  alerts: Alert[];
  adherenceRate: number;
}

export type Role = "patient" | "caregiver";

export type CarePlanAction =
  | { type: "LOAD_PLAN"; payload: CarePlan }
  | { type: "TOGGLE_ROLE" }
  | { type: "SET_ROLE"; payload: Role }
  | { type: "MARK_MED_TAKEN"; payload: { medicationId: string } }
  | { type: "SUBMIT_CHECK_IN"; payload: CheckInEntry }
  | { type: "DISMISS_ALERT"; payload: { alertId: string } }
  | { type: "TOGGLE_CHECKLIST"; payload: { itemId: string } };

export interface CarePlanState {
  carePlan: CarePlan | null;
  role: Role;
  checkIns: CheckInEntry[];
}