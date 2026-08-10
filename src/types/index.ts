export interface Patient {
  id: string;
  name: string;
  discharge_date: string | null;
  status: 'on_track' | 'needs_attention' | 'overdue_checkin';
  created_at: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
}

export interface Appointment {
  type: string;
  date: string;
  provider: string;
  notes: string;
}

export interface WarningSign {
  sign: string;
  action: string;
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface DischargeSummary {
  id: string;
  patient_id: string;
  raw_text: string | null;
  medications: Medication[];
  appointments: Appointment[];
  warning_signs: WarningSign[];
  emergency_contacts: EmergencyContact[];
  care_instructions: string;
  dietary_restrictions: string;
  activity_restrictions: string;
  created_at: string;
}

export interface CheckIn {
  id: string;
  patient_id: string;
  transcript: string;
  analysis_result: AnalysisResult | null;
  duration_seconds: number;
  created_at: string;
}

export interface AnalysisResult {
  summary: string;
  flags: Flag[];
  overall_status: 'on_track' | 'mild_concern' | 'needs_attention';
  emergency_warning: boolean;
  emergency_detail: string | null;
}

export interface Flag {
  type: 'concern' | 'positive' | 'info';
  category: string;
  detail: string;
}

export type UserRole = 'patient' | 'caregiver';

export function formatStatusLabel(status: Patient['status']): string {
  const labels: Record<string, string> = {
    on_track: 'On Track',
    needs_attention: 'Needs Attention',
    overdue_checkin: 'Overdue Check-in',
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: Patient['status']): string {
  const colors: Record<string, string> = {
    on_track: 'text-success',
    needs_attention: 'text-destructive',
    overdue_checkin: 'text-warning',
  };
  return colors[status] ?? 'text-muted';
}

export function getStatusBg(status: Patient['status']): string {
  const colors: Record<string, string> = {
    on_track: 'bg-green-100 text-green-800',
    needs_attention: 'bg-red-100 text-red-800',
    overdue_checkin: 'bg-amber-100 text-amber-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}