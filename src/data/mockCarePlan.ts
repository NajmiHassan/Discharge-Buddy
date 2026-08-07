import type { CarePlan, Alert } from "../types";

const now = new Date();
const today = now.toISOString().split("T")[0];
const hours = now.getHours();
const minutes = now.getMinutes();
const currentTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

// Sample alerts — some active, some dismissed
const sampleAlerts: Alert[] = [
  {
    id: "alert-1",
    type: "red_flag",
    message: "Patient reported shortness of breath that doesn't improve with rest. Contact Dr. Patel if this continues.",
    severity: "high",
    timestamp: `${today}T14:30:00`,
    dismissed: false,
  },
  {
    id: "alert-2",
    type: "missed_dose",
    message: "Furosemide dose was missed at 8:00 AM. Take the next dose as scheduled unless advised otherwise.",
    severity: "high",
    timestamp: `${today}T09:15:00`,
    dismissed: false,
  },
  {
    id: "alert-3",
    type: "warning",
    message: "Weight gain of 2 lbs in 24 hours. Monitor closely — 3+ lbs in 24 hours is a red flag.",
    severity: "medium",
    timestamp: `${today}T07:00:00`,
    dismissed: false,
  },
  {
    id: "alert-4",
    type: "missed_dose",
    message: "Evening dose of Metoprolol Succinate was not taken yesterday.",
    severity: "medium",
    timestamp: `${new Date(now.getTime() - 86400000).toISOString()}`,
    dismissed: true,
  },
];

export const mockCarePlan: CarePlan = {
  patientName: "Robert Johnson",
  adherenceRate: 0.8,

  medications: [
    {
      id: "med-1",
      name: "Furosemide",
      dosage: "40 mg",
      frequency: "Once daily",
      times: ["08:00"],
      notes: "Take with breakfast",
      takenToday: currentTime >= "08:00",
    },
    {
      id: "med-2",
      name: "Lisinopril",
      dosage: "10 mg",
      frequency: "Once daily",
      times: ["08:00"],
      notes: "",
      takenToday: currentTime >= "08:00",
    },
    {
      id: "med-3",
      name: "Metoprolol Succinate",
      dosage: "50 mg",
      frequency: "Once daily",
      times: ["20:00"],
      notes: "",
      takenToday: false,
    },
    {
      id: "med-4",
      name: "Warfarin",
      dosage: "2.5 mg",
      frequency: "Once daily",
      times: ["18:00"],
      notes: "Check INR weekly",
      takenToday: false,
    },
    {
      id: "med-5",
      name: "Potassium Chloride",
      dosage: "20 mEq",
      frequency: "Once daily",
      times: ["08:00"],
      notes: "",
      takenToday: currentTime >= "08:00",
    },
  ],

  appointments: [
    {
      id: "apt-1",
      date: "Mon, Jun 17",
      time: "10:00 AM",
      specialist: "PCP follow-up",
      location: "Dr. Chen, 123 Main St",
    },
    {
      id: "apt-2",
      date: "Mon, Jun 24",
      time: "9:00 AM",
      specialist: "INR lab draw",
      location: "LabCorp, 456 Oak Ave",
    },
    {
      id: "apt-3",
      date: "Fri, Jul 5",
      time: "2:00 PM",
      specialist: "Cardiologist",
      location: "Dr. Patel, 789 Heart Dr",
    },
  ],

  checklist: [
    { id: "chk-1", text: "Weigh yourself every morning", completed: false },
    { id: "chk-2", text: "Check ankles for swelling", completed: false },
    { id: "chk-3", text: "Follow low-sodium diet (< 1500mg/day)", completed: false },
    { id: "chk-4", text: "Walk for 10 minutes", completed: false },
  ],

  warningSigns: [
    { id: "ws-1", text: "Shortness of breath that doesn't improve with rest", active: true },
    { id: "ws-2", text: "Weight gain of 3+ lbs in 24 hours or 5+ lbs in a week", active: false },
    { id: "ws-3", text: "New or worsening ankle swelling", active: false },
    { id: "ws-4", text: "Dizziness or fainting", active: false },
    { id: "ws-5", text: "Chest pain or pressure", active: false },
  ],

  questionsForDoctor: [
    "Is my current diuretic dose still appropriate given my daily weight trends?",
    "When can I resume driving?",
    "Are there any dietary restrictions I should continue long-term?",
  ],

  alerts: sampleAlerts,
};