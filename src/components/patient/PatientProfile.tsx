import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Pill,
  Calendar,
  AlertTriangle,
  Phone,
  FileText,
  ClipboardList,
  Activity,
  Mic,
  ChevronDown,
  ChevronUp,
  Heart,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppState } from '../../context/AppContext';
import type { Patient, DischargeSummary, CheckIn } from '../../types';
import { formatStatusLabel, getStatusBg } from '../../types';

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAppState();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [summary, setSummary] = useState<DischargeSummary | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  async function loadData(patientId: string) {
    try {
      const [patientRes, summaryRes, checkInsRes] = await Promise.all([
        supabase.from('patients').select('*').eq('id', patientId).single(),
        supabase.from('discharge_summaries').select('*').eq('patient_id', patientId).single(),
        supabase
          .from('check_ins')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (patientRes.error) throw patientRes.error;
      if (summaryRes.error && summaryRes.error.code !== 'PGRST116') throw summaryRes.error;
      if (checkInsRes.error) throw checkInsRes.error;

      setPatient(patientRes.data);
      setSummary(summaryRes.data ?? null);
      setCheckIns(checkInsRes.data ?? []);
    } catch (err) {
      console.error('Error loading patient data:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(name: string) {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function readAloud() {
    if (!summary) return;
    const text = [
      `Discharge instructions for ${patient?.name}.`,
      'Medications:',
      ...summary.medications.map((m) => `${m.name}, ${m.dosage}, ${m.frequency}. ${m.purpose}.`),
      'Appointments:',
      ...summary.appointments.map((a) => `${a.type} on ${a.date} with ${a.provider}. ${a.notes}`),
      'Warning signs:',
      ...summary.warning_signs.map((w) => `${w.sign}. If this happens: ${w.action}.`),
      'Care instructions:',
      summary.care_instructions,
      'Dietary restrictions:',
      summary.dietary_restrictions,
      'Activity restrictions:',
      summary.activity_restrictions,
    ].join('\n');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <h2 className="font-heading font-semibold text-lg">Patient not found</h2>
        <Link to="/" className="text-primary underline mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const isPatientView = role === 'patient';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Patient header */}
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {patient.name}
        </h2>
        <div className="flex items-center gap-3 mt-1">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBg(patient.status)}`}
          >
            {formatStatusLabel(patient.status)}
          </span>
          {patient.discharge_date && (
            <span className="text-sm text-muted-foreground">
              Discharged {new Date(patient.discharge_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <Link
          to={`/checkin/${patient.id}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 active:scale-[0.97] transition-all"
        >
          <Mic className="w-5 h-5" />
          Start Check-in
        </Link>
        <button
          onClick={readAloud}
          disabled={!summary}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-border transition-all disabled:opacity-50"
        >
          <FileText className="w-5 h-5" />
          Read Aloud
        </button>
      </div>

      {!summary ? (
        <div className="text-center py-8 bg-muted rounded-xl">
          <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No discharge summary available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* PATIENT VIEW - Simple overview */}
          {isPatientView && (
            <>
              {/* Medications */}
              <Section
                title="Medications"
                icon={<Pill className="w-5 h-5 text-primary" />}
                expanded={expandedSections.meds ?? true}
                onToggle={() => toggleSection('meds')}
              >
                <div className="space-y-2">
                  {summary.medications.map((med, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3">
                      <div className="font-medium text-foreground">{med.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {med.dosage} — {med.frequency}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Next appointment */}
              {summary.appointments.length > 0 && (
                <Section
                  title="Next Appointment"
                  icon={<Calendar className="w-5 h-5 text-primary" />}
                  expanded={expandedSections.appt ?? true}
                  onToggle={() => toggleSection('appt')}
                >
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="font-medium text-foreground">
                      {summary.appointments[0].type}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {new Date(summary.appointments[0].date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-foreground mt-0.5">
                      {summary.appointments[0].provider}
                    </div>
                  </div>
                </Section>
              )}

              {/* Things to watch for (simplified) */}
              <Section
                title="Things to Watch For"
                icon={<AlertTriangle className="w-5 h-5 text-warning" />}
                expanded={expandedSections.watch ?? true}
                onToggle={() => toggleSection('watch')}
              >
                <div className="space-y-2">
                  {summary.warning_signs.map((sign, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{sign.sign}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* CAREGIVER VIEW - Full detail */}
          {!isPatientView && (
            <>
              {/* Medications */}
              <CollapsibleSection
                title="Medications"
                icon={<Pill className="w-5 h-5 text-primary" />}
                sectionKey="meds"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              >
                {summary.medications.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No medications listed</p>
                ) : (
                  <div className="space-y-2">
                    {summary.medications.map((med, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-3">
                        <div className="font-medium text-foreground">{med.name}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {med.dosage} — {med.frequency}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {med.purpose}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Appointments */}
              <CollapsibleSection
                title="Appointments"
                icon={<Calendar className="w-5 h-5 text-primary" />}
                sectionKey="appts"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              >
                {summary.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No appointments scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {summary.appointments.map((appt, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-3">
                        <div className="font-medium text-foreground">{appt.type}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {new Date(appt.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-sm text-foreground">{appt.provider}</div>
                        {appt.notes && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {appt.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Warning Signs */}
              <CollapsibleSection
                title="Warning Signs"
                icon={<AlertTriangle className="w-5 h-5 text-warning" />}
                sectionKey="warnings"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              >
                {summary.warning_signs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No warning signs listed</p>
                ) : (
                  <div className="space-y-2">
                    {summary.warning_signs.map((sign, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="font-medium text-amber-900 text-sm">{sign.sign}</div>
                        <div className="text-xs text-amber-700 mt-1">
                          Action: {sign.action}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Emergency Contacts */}
              <CollapsibleSection
                title="Emergency Contacts"
                icon={<Phone className="w-5 h-5 text-destructive" />}
                sectionKey="contacts"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              >
                {summary.emergency_contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No emergency contacts</p>
                ) : (
                  <div className="space-y-2">
                    {summary.emergency_contacts.map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                        <div>
                          <div className="font-medium text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.role}</div>
                        </div>
                        <a
                          href={`tel:${c.phone}`}
                          className="text-primary font-medium text-sm hover:underline"
                        >
                          {c.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Care Instructions */}
              <CollapsibleSection
                title="Care Instructions"
                icon={<FileText className="w-5 h-5 text-primary" />}
                sectionKey="care"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              >
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {summary.care_instructions || 'No care instructions listed'}
                </p>
              </CollapsibleSection>

              {/* Dietary Restrictions */}
              <CollapsibleSection
                title="Dietary Restrictions"
                icon={<ClipboardList className="w-5 h-5 text-primary" />}
                sectionKey="diet"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              >
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {summary.dietary_restrictions || 'No dietary restrictions listed'}
                </p>
              </CollapsibleSection>

              {/* Activity Restrictions */}
              <CollapsibleSection
                title="Activity Restrictions"
                icon={<Activity className="w-5 h-5 text-primary" />}
                sectionKey="activity"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              >
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {summary.activity_restrictions || 'No activity restrictions listed'}
                </p>
              </CollapsibleSection>
            </>
          )}

          {/* Check-in History (caregiver view only) */}
          {!isPatientView && checkIns.length > 0 && (
            <div className="mt-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Check-in History
              </h3>
              <div className="space-y-2">
                {checkIns.map((checkin) => (
                  <Link
                    key={checkin.id}
                    to={`/checkin/${patient.id}/result/${checkin.id}`}
                    className="block bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-all no-underline"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground">
                        {new Date(checkin.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                      {checkin.analysis_result && (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            checkin.analysis_result.overall_status === 'on_track'
                              ? 'bg-green-100 text-green-800'
                              : checkin.analysis_result.overall_status === 'mild_concern'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {checkin.analysis_result.overall_status === 'on_track'
                            ? 'On Track'
                            : checkin.analysis_result.overall_status === 'mild_concern'
                              ? 'Mild Concern'
                              : 'Needs Attention'}
                        </span>
                      )}
                    </div>
                    {checkin.analysis_result?.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {checkin.analysis_result.summary}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Trend indicator */}
          {!isPatientView && checkIns.length > 0 && (
            <div className="bg-muted rounded-xl p-4 text-center mt-4">
              <p className="text-sm text-muted-foreground">
                {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''} recorded
                {checkIns.filter((c) => c.analysis_result?.overall_status === 'on_track').length ===
                  checkIns.length && ' — all on track 🎉'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Section wrappers */

function Section({
  title,
  icon,
  children,
  expanded,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between cursor-pointer"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-heading font-semibold text-foreground">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {expanded && <div className="mt-3">{children}</div>}
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  sectionKey,
  expandedSections,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  sectionKey: string;
  expandedSections: Record<string, boolean>;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Section
      title={title}
      icon={icon}
      expanded={expandedSections[sectionKey] ?? true}
      onToggle={() => onToggle(sectionKey)}
    >
      {children}
    </Section>
  );
}