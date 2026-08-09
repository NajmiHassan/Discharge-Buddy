import { Navigate } from "react-router-dom";
import { useCarePlan } from "../contexts/CarePlanContext";
import { Card, Badge, Button } from "../components/ui";

/* ─── Patient Plan View ─── */

function PatientPlanView() {
  const { state, markMedTaken, toggleChecklist } = useCarePlan();
  const plan = state.carePlan!;

  // Find the next medication due today
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextMed = plan.medications
    .filter((m) => {
      const [h, min] = m.times[0].split(":").map(Number);
      const medMinutes = h * 60 + min;
      return medMinutes >= currentMinutes && !m.takenToday;
    })
    .sort((a, b) => {
      const [ah, amin] = a.times[0].split(":").map(Number);
      const [bh, bmin] = b.times[0].split(":").map(Number);
      return ah * 60 + amin - (bh * 60 + bmin);
    })[0];

  const nextAppt = plan.appointments[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero card — What to do now */}
      <Card variant="success">
        <h2 className="text-[36px] font-bold text-[#1B2A4A] mb-2">What to do now</h2>

        {nextMed ? (
          <div className="mt-4 p-4 bg-[#4A9E8E]/5 rounded-xl">
            <p className="text-[18px] text-[#1B2A4A]/70 font-medium">Next medication</p>
            <p className="text-[28px] font-bold text-[#1B2A4A] mt-1">
              {nextMed.name} — {nextMed.dosage}
            </p>
            <p className="text-[20px] text-[#1B2A4A]/70 mt-1">
              Due at {nextMed.times[0]}
            </p>
            {nextMed.notes && (
              <p className="text-[16px] text-[#1B2A4A]/50 mt-1">{nextMed.notes}</p>
            )}
            <Button variant="primary" className="mt-4" onClick={() => markMedTaken(nextMed.id)}>
              ✓ Mark as taken
            </Button>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-[#4A9E8E]/10 rounded-xl">
            <p className="text-[24px] font-bold text-[#4A9E8E]">
              All medications taken ✓
            </p>
            <p className="text-[18px] text-[#1B2A4A]/70 mt-1">
              Great job! Your next dose is due at 6:00 PM.
            </p>
          </div>
        )}
      </Card>

      {/* Next appointment */}
      <Card variant="warning">
        <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-2">Next appointment</h3>
        <p className="text-[24px] font-semibold text-[#1B2A4A]">{nextAppt.specialist}</p>
        <p className="text-[20px] text-[#1B2A4A]/70">
          {nextAppt.date} at {nextAppt.time}
        </p>
        <p className="text-[18px] text-[#1B2A4A]/50 mt-1">{nextAppt.location}</p>
      </Card>

      {/* Today's checklist */}
      <Card>
        <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-3">Today's checklist</h3>
        <div className="flex flex-col gap-2">
          {plan.checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleChecklist(item.id)}
              className={`
                flex items-center gap-4 p-4 rounded-xl text-left transition-all cursor-pointer
                ${item.completed
                  ? "bg-[#4A9E8E]/10 text-[#1B2A4A]/60"
                  : "bg-[#F8F6F3] hover:bg-[#F8F6F3]/80 text-[#1B2A4A]"
                }
              `}
            >
              <span
                className={`
                  w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[16px]
                  ${item.completed
                    ? "bg-[#4A9E8E] border-[#4A9E8E] text-white"
                    : "border-[#1B2A4A]/30"
                  }
                `}
              >
                {item.completed ? "✓" : ""}
              </span>
              <span className={`text-[20px] ${item.completed ? "line-through" : ""}`}>
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─── Caregiver Plan View ─── */

function CaregiverPlanView() {
  const { state } = useCarePlan();
  const plan = state.carePlan!;

  const missedDoses = plan.medications.filter((m) => !m.takenToday);
  const activeWarnings = plan.warningSigns.filter((w) => w.active);
  const adherencePercent = Math.round(plan.adherenceRate * 100);
  const adherenceStatus: "success" | "warning" | "danger" =
    adherencePercent >= 80 ? "success" : adherencePercent >= 60 ? "warning" : "danger";

  return (
    <div>
      <h2 className="text-[28px] font-bold text-[#1B2A4A] mb-6">Patient Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Adherence Rate */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[20px] font-bold text-[#1B2A4A]">Adherence Rate</h3>
            <Badge variant={adherenceStatus}>
              {adherencePercent >= 80 ? "On track" : adherencePercent >= 60 ? "Needs attention" : "Critical"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-[48px] font-bold ${
              adherenceStatus === "success" ? "text-[#4A9E8E]" :
              adherenceStatus === "warning" ? "text-[#E8A838]" : "text-[#D14B4B]"
            }`}>
              {adherencePercent}%
            </span>
            <div className="flex-1 h-3 rounded-full bg-[#F8F6F3] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  adherenceStatus === "success" ? "bg-[#4A9E8E]" :
                  adherenceStatus === "warning" ? "bg-[#E8A838]" : "bg-[#D14B4B]"
                }`}
                style={{ width: `${adherencePercent}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-3">Upcoming Appointments</h3>
          <div className="flex flex-col gap-3">
            {plan.appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-[#F8F6F3] rounded-xl">
                <div>
                  <p className="text-[18px] font-semibold text-[#1B2A4A]">{apt.specialist}</p>
                  <p className="text-[15px] text-[#1B2A4A]/60">{apt.date} at {apt.time}</p>
                </div>
                <Badge variant="info">{apt.location.split(",")[0]}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Missed Doses */}
        <Card variant={missedDoses.length > 0 ? "alert" : "success"}>
          <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-3">Missed Doses</h3>
          {missedDoses.length > 0 ? (
            <>
              <p className="text-[36px] font-bold text-[#D14B4B]">{missedDoses.length}</p>
              <p className="text-[16px] text-[#1B2A4A]/60 mb-3">Not taken today</p>
              <div className="flex flex-col gap-2">
                {missedDoses.map((med) => (
                  <div key={med.id} className="flex items-center gap-2 text-[16px]">
                    <span className="w-2 h-2 rounded-full bg-[#D14B4B]" />
                    <span className="text-[#1B2A4A]">{med.name} — {med.dosage}</span>
                    <span className="text-[#1B2A4A]/40 ml-auto">{med.times[0]}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[20px] font-semibold text-[#4A9E8E]">All doses taken today ✓</p>
          )}
        </Card>

        {/* Warning Signs */}
        <Card variant={activeWarnings.length > 0 ? "alert" : "default"}>
          <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-3">Warning Signs</h3>
          {activeWarnings.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeWarnings.map((w) => (
                <div key={w.id} className="flex items-start gap-2 p-3 bg-[#D14B4B]/5 rounded-xl">
                  <span className="text-[#D14B4B] text-[18px] mt-0.5">⚠</span>
                  <p className="text-[16px] text-[#1B2A4A]">{w.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[18px] text-[#1B2A4A]/60">No active warning signs</p>
          )}
          <div className="mt-4">
            <p className="text-[16px] font-medium text-[#1B2A4A]/70 mb-2">All warning signs:</p>
            <div className="flex flex-col gap-1.5">
              {plan.warningSigns.map((w) => (
                <div key={w.id} className="flex items-center gap-2 text-[15px]">
                  <span className={`w-2 h-2 rounded-full ${w.active ? "bg-[#D14B4B]" : "bg-[#4A9E8E]"}`} />
                  <span className={w.active ? "text-[#1B2A4A]" : "text-[#1B2A4A]/50"}>
                    {w.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Questions for Next Appointment */}
        <Card className="md:col-span-2">
          <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-3">
            Questions to ask at the next appointment
          </h3>
          <div className="flex flex-col gap-3">
            {plan.questionsForDoctor.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#F8F6F3] rounded-xl">
                <span className="w-7 h-7 rounded-full bg-[#1B2A4A] text-white text-[14px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-[18px] text-[#1B2A4A]">{q}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── Plan Overview Page ─── */

export default function PlanOverviewPage() {
  const { state } = useCarePlan();

  if (!state.carePlan) {
    return <Navigate to="/upload" replace />;
  }

  return state.role === "patient" ? <PatientPlanView /> : <CaregiverPlanView />;
}