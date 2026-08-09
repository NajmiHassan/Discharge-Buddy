import { Navigate } from "react-router-dom";
import { useCarePlan } from "../contexts/CarePlanContext";
import { Card, Badge, Button } from "../components/ui";

/* ─── Patient Medication View ─── */

function PatientMedicationView() {
  const { state, markMedTaken } = useCarePlan();
  const plan = state.carePlan!;

  // Today's medications ordered by time
  const todayMeds = [...plan.medications].sort((a, b) => {
    const [ah, amin] = a.times[0].split(":").map(Number);
    const [bh, bmin] = b.times[0].split(":").map(Number);
    return ah * 60 + amin - (bh * 60 + bmin);
  });

  const allTaken = todayMeds.every((m) => m.takenToday);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[28px] font-bold text-[#1B2A4A]">Today's Medications</h2>

      {allTaken && (
        <Card variant="success">
          <p className="text-[22px] font-bold text-[#4A9E8E]">
            All medications taken ✓
          </p>
          <p className="text-[18px] text-[#1B2A4A]/70 mt-1">
            Great job staying on track!
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {todayMeds.map((med) => {
          const timeLabel = med.times[0];
          const isMorning = parseInt(timeLabel.split(":")[0]) < 12;
          const period = isMorning ? "Morning" : "Evening";

          return (
            <Card key={med.id} variant={med.takenToday ? "success" : "default"}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center flex-shrink-0 w-16">
                  <span className="text-[24px] font-bold text-[#1B2A4A]">{timeLabel}</span>
                  <span className="text-[12px] text-[#1B2A4A]/50 font-medium">{period}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[24px] font-bold text-[#1B2A4A]">{med.name}</h3>
                    <Badge variant="info">{med.dosage}</Badge>
                  </div>
                  <p className="text-[18px] text-[#1B2A4A]/60 mt-1">
                    {med.frequency}
                  </p>
                  {med.notes && (
                    <p className="text-[16px] text-[#1B2A4A]/50 mt-1">{med.notes}</p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {med.takenToday ? (
                    <div className="flex items-center gap-2 h-[56px] px-4">
                      <span className="text-[20px] text-[#4A9E8E] font-semibold">Taken ✓</span>
                    </div>
                  ) : (
                    <Button
                      variant="success"
                      className="whitespace-nowrap"
                      onClick={() => markMedTaken(med.id)}
                    >
                      ✓ Taken
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Caregiver Medication View ─── */

function CaregiverMedicationView() {
  const { state } = useCarePlan();
  const plan = state.carePlan!;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Simulate weekly adherence (each medication has some taken/some missed)
  const getWeeklyAdherence = (medId: string) => {
    // Deterministic pseudo-random based on med ID for consistent demo data
    const seed = medId.charCodeAt(medId.length - 1);
    return days.map((_, i) => {
      if (i > new Date().getDay() && medId === "med-3") return null; // Future days
      return (seed + i * 3) % 7 > 2; // ~57% taken
    });
  };

  // Group by time of day
  const morningMeds = plan.medications.filter((m) => {
    const hour = parseInt(m.times[0].split(":")[0]);
    return hour < 12;
  });

  const eveningMeds = plan.medications.filter((m) => {
    const hour = parseInt(m.times[0].split(":")[0]);
    return hour >= 12;
  });

  const renderMedicationCard = (med: typeof plan.medications[0]) => {
    const adherence = getWeeklyAdherence(med.id);
    const takenCount = adherence.filter(Boolean).length;
    const totalCount = adherence.filter((d) => d !== null).length;

    return (
      <Card key={med.id}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-[22px] font-bold text-[#1B2A4A]">{med.name}</h3>
            <p className="text-[18px] text-[#1B2A4A]/70">
              {med.dosage} — {med.times[0]} — {med.frequency}
            </p>
          </div>
          <Badge variant={med.takenToday ? "success" : "warning"}>
            {med.takenToday ? "Taken today" : "Not taken"}
          </Badge>
        </div>

        {/* Weekly adherence row */}
        <div className="flex gap-2 mb-3">
          {days.map((day, i) => {
            const taken = adherence[i];
            const isFuture = taken === null;
            return (
              <div key={day} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[11px] text-[#1B2A4A]/50 font-medium">{day}</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold
                    ${isFuture
                      ? "bg-[#F8F6F3] text-[#1B2A4A]/20"
                      : taken
                        ? "bg-[#4A9E8E]/15 text-[#4A9E8E]"
                        : "bg-[#D14B4B]/10 text-[#D14B4B]"
                    }`}
                >
                  {isFuture ? "—" : taken ? "✓" : "✗"}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[15px] text-[#1B2A4A]/50">
          {takenCount} of {totalCount} doses taken this week
        </p>

        {med.notes && (
          <p className="text-[14px] text-[#E8A838] font-medium mt-2">{med.notes}</p>
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[28px] font-bold text-[#1B2A4A]">Weekly Medication Schedule</h2>

      {morningMeds.length > 0 && (
        <div>
          <h3 className="text-[20px] font-bold text-[#1B2A4A]/60 mb-3">☀️ Morning</h3>
          <div className="flex flex-col gap-4">
            {morningMeds.map(renderMedicationCard)}
          </div>
        </div>
      )}

      {eveningMeds.length > 0 && (
        <div>
          <h3 className="text-[20px] font-bold text-[#1B2A4A]/60 mb-3">🌙 Evening</h3>
          <div className="flex flex-col gap-4">
            {eveningMeds.map(renderMedicationCard)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Medication Schedule Page ─── */

export default function MedicationSchedulePage() {
  const { state } = useCarePlan();

  if (!state.carePlan) {
    return <Navigate to="/upload" replace />;
  }

  return state.role === "patient" ? <PatientMedicationView /> : <CaregiverMedicationView />;
}