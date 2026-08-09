import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useCarePlan } from "../contexts/CarePlanContext";
import { Card, Badge, Button, EmojiScale } from "../components/ui";

/* ─── Patient Check-in View ─── */

function PatientCheckInView() {
  const { state, markMedTaken, submitCheckIn } = useCarePlan();
  const plan = state.carePlan!;

  // Today's medications not yet taken
  const pendingMeds = plan.medications.filter((m) => !m.takenToday);
  const [currentMedIndex, setCurrentMedIndex] = useState(0);
  const [medAnswers, setMedAnswers] = useState<Record<string, boolean>>({});
  const [feeling, setFeeling] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Check if already checked in today
  const today = new Date().toISOString().split("T")[0];
  const alreadyCheckedIn = state.checkIns.some(
    (ci) => ci.date === today
  );

  if (alreadyCheckedIn) {
    const todaysCheckIns = state.checkIns.filter((ci) => ci.date === today);
    const firstEntry = todaysCheckIns[0];
    const feelingLabel = firstEntry?.feeling
      ? ({ very_unwell: "Very unwell", okay: "Okay", good: "Good", great: "Great", excellent: "Excellent" } as Record<string, string>)[firstEntry.feeling]
      : null;

    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-[28px] font-bold text-[#1B2A4A]">Today's Check-in</h2>
        <Card variant="success">
          <p className="text-[24px] font-bold text-[#4A9E8E]">
            You checked in today ✓
          </p>
          <p className="text-[18px] text-[#1B2A4A]/70 mt-2">
            Your check-in was recorded at{" "}
            {new Date(firstEntry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
          </p>
          {feelingLabel && (
            <p className="text-[18px] text-[#1B2A4A] mt-2">
              Feeling: {feelingLabel}
            </p>
          )}
          <p className="text-[18px] text-[#1B2A4A]/70 mt-1">
            Medications taken today:{" "}
            {state.checkIns.filter((ci) => ci.date === today && ci.taken).length} of{" "}
            {plan.medications.length}
          </p>
        </Card>
      </div>
    );
  }

  // If no medications at all or all are already taken, show a simplified check-in
  if (pendingMeds.length === 0 || currentMedIndex >= pendingMeds.length) {
    // All medications answered, now show feeling + symptoms
    const handleSubmit = () => {
      // Record a check-in entry for each medication
      const timestamp = new Date().toISOString();
      const allMeds = plan.medications.length > 0 ? plan.medications : pendingMeds;
      allMeds.forEach((med) => {
        const taken = medAnswers[med.id] ?? false;
        submitCheckIn({
          date: today,
          medicationId: med.id,
          medicationName: med.name,
          taken,
          feeling: feeling ?? undefined,
          symptoms: symptoms.trim() || undefined,
          timestamp,
        });
        if (taken) markMedTaken(med.id);
      });
      setSubmitted(true);
    };

    if (submitted) {
      return (
        <div className="flex flex-col gap-6">
          <h2 className="text-[28px] font-bold text-[#1B2A4A]">Today's Check-in</h2>
          <Card variant="success">
            <p className="text-[24px] font-bold text-[#4A9E8E]">
              Check-in recorded ✓
            </p>
            <p className="text-[18px] text-[#1B2A4A]/70 mt-2">
              Your responses have been saved. Your caregiver can see them on their dashboard.
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-[28px] font-bold text-[#1B2A4A]">Today's Check-in</h2>

        {/* Step 2 — How are you feeling? */}
        <Card>
          <h3 className="text-[24px] font-bold text-[#1B2A4A] mb-4">
            How are you feeling today?
          </h3>
          <EmojiScale selected={feeling} onChange={setFeeling} />
        </Card>

        {/* Step 3 — Symptoms */}
        <Card>
          <h3 className="text-[24px] font-bold text-[#1B2A4A] mb-3">
            Any symptoms to report?
          </h3>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., felt short of breath after walking to the kitchen"
            className="w-full min-h-[120px] p-4 text-[18px] bg-[#F8F6F3] rounded-xl border border-[#1B2A4A]/10
                       text-[#1A1A1A] placeholder:text-[#1B2A4A]/30 outline-none focus:border-[#1B2A4A] transition-colors resize-none"
            rows={4}
          />
        </Card>

        <Button variant="primary" fullWidth onClick={handleSubmit}>
          Submit Check-in
        </Button>
      </div>
    );
  }

  // Step 1 — Medication confirmation
  const currentMed = pendingMeds[currentMedIndex];

  const handleMedAnswer = (taken: boolean) => {
    setMedAnswers((prev) => ({ ...prev, [currentMed.id]: taken }));
    if (taken) {
      markMedTaken(currentMed.id);
    }
    setCurrentMedIndex((i) => i + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[28px] font-bold text-[#1B2A4A]">Today's Check-in</h2>

      <Card>
        <p className="text-[18px] text-[#1B2A4A]/70 mb-2">
          Step {currentMedIndex + 1} of {pendingMeds.length + 3}
        </p>
        <h3 className="text-[24px] font-bold text-[#1B2A4A] mb-2">
          Did you take your {currentMed.name}?
        </h3>
        <p className="text-[20px] text-[#1B2A4A]/70 mb-4">
          {currentMed.dosage} — {currentMed.times[0]}
        </p>
        <div className="flex gap-4">
          <Button variant="success" fullWidth onClick={() => handleMedAnswer(true)}>
            Yes
          </Button>
          <Button variant="outline" fullWidth onClick={() => handleMedAnswer(false)}>
            No
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Caregiver Check-in View ─── */

function CaregiverCheckInView() {
  const { state } = useCarePlan();
  const plan = state.carePlan!;

  const today = new Date().toISOString().split("T")[0];
  const todaysCheckIns = state.checkIns.filter((ci) => ci.date === today);
  const allCheckIns = [...state.checkIns].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Simulate some check-in data if none exist yet (for demo purposes)
  const hasMockData = allCheckIns.length === 0;

  const takenCount = todaysCheckIns.filter((ci) => ci.taken).length;
  const totalToday = plan.medications.length;
  const adherencePercent = totalToday > 0 ? Math.round((takenCount / totalToday) * 100) : 0;
  const adherenceStatus: "success" | "warning" | "danger" =
    adherencePercent >= 80 ? "success" : adherencePercent >= 60 ? "warning" : "danger";

  // First check-in's feeling and symptoms
  const latestFeeling = todaysCheckIns.find((ci) => ci.feeling)?.feeling;
  const latestSymptoms = todaysCheckIns.find((ci) => ci.symptoms)?.symptoms;

  const feelingEmojis: Record<string, string> = {
    very_unwell: "😢", okay: "😐", good: "😊", great: "😄", excellent: "🌟",
  };
  const feelingLabels: Record<string, string> = {
    very_unwell: "Very unwell", okay: "Okay", good: "Good", great: "Great", excellent: "Excellent",
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[28px] font-bold text-[#1B2A4A]">Patient Check-in</h2>

      {/* Today's check-in status */}
      {todaysCheckIns.length === 0 ? (
        <Card variant="warning">
          <h3 className="text-[20px] font-bold text-[#E8A838] mb-2">
            Patient hasn't checked in today yet
          </h3>
          <p className="text-[18px] text-[#1B2A4A]/70">
            {hasMockData
              ? "No check-in data available yet. Check-in data will appear here once the patient submits their daily check-in."
              : "Last check-in: No previous check-in found."}
          </p>
        </Card>
      ) : (
        <>
          {/* Adherence summary */}
          <Card variant={adherencePercent >= 80 ? "success" : "warning"}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[20px] font-bold text-[#1B2A4A]">Today's Adherence</h3>
              <Badge variant={adherenceStatus}>
                {adherencePercent >= 80 ? "Good" : "Needs attention"}
              </Badge>
            </div>
            <p className="text-[36px] font-bold text-[#1B2A4A]">
              {takenCount} of {totalToday}
            </p>
            <p className="text-[18px] text-[#1B2A4A]/60">doses taken today</p>
          </Card>

          {/* Feeling */}
          {latestFeeling && (
            <Card>
              <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-3">
                Patient reported feeling:
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-[48px]">{feelingEmojis[latestFeeling]}</span>
                <span className="text-[24px] font-semibold text-[#1B2A4A]">
                  {feelingLabels[latestFeeling]}
                </span>
              </div>
            </Card>
          )}

          {/* Symptoms */}
          {latestSymptoms ? (
            <Card variant="alert">
              <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-2">
                Symptoms reported
              </h3>
              <p className="text-[18px] text-[#1B2A4A]">{latestSymptoms}</p>
            </Card>
          ) : (
            <Card>
              <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-2">
                Symptoms
              </h3>
              <p className="text-[18px] text-[#4A9E8E]">No symptoms reported today ✓</p>
            </Card>
          )}
        </>
      )}

      {/* Symptom log */}
      <Card>
        <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-3">Check-in History</h3>
        {allCheckIns.length > 0 ? (
          <div className="flex flex-col gap-3">
            {allCheckIns.slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#F8F6F3] rounded-xl">
                <div className="flex-1">
                  <p className="text-[16px] font-medium text-[#1B2A4A]">
                    {entry.medicationName}
                  </p>
                  <p className="text-[14px] text-[#1B2A4A]/60">
                    {new Date(entry.timestamp).toLocaleDateString()}{" "}
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Badge variant={entry.taken ? "success" : "danger"}>
                  {entry.taken ? "Taken" : "Missed"}
                </Badge>
                {entry.symptoms && (
                  <span className="text-[20px]" title={entry.symptoms}>⚠️</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[18px] text-[#1B2A4A]/60">
            No check-in history available yet.
          </p>
        )}
      </Card>
    </div>
  );
}

/* ─── Daily Check-in Page ─── */

export default function DailyCheckInPage() {
  const { state } = useCarePlan();

  if (!state.carePlan) {
    return <Navigate to="/upload" replace />;
  }

  return state.role === "patient" ? <PatientCheckInView /> : <CaregiverCheckInView />;
}