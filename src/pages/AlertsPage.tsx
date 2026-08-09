import { Navigate } from "react-router-dom";
import { useCarePlan } from "../contexts/CarePlanContext";
import { Card, Badge, Button } from "../components/ui";

/* ─── Patient Alerts View ─── */

function PatientAlertsView() {
  const { state, dismissAlert } = useCarePlan();
  const plan = state.carePlan!;

  const activeAlerts = plan.alerts.filter((a) => !a.dismissed);

  if (activeAlerts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-[28px] font-bold text-[#1B2A4A]">Alerts</h2>
        <Card variant="success">
          <p className="text-[24px] font-bold text-[#4A9E8E]">
            All clear! ✓
          </p>
          <p className="text-[18px] text-[#1B2A4A]/70 mt-2">
            No new alerts. Everything is on track.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[28px] font-bold text-[#1B2A4A]">Alerts</h2>
      <p className="text-[18px] text-[#1B2A4A]/60">
        {activeAlerts.length} alert{activeAlerts.length > 1 ? "s" : ""} need{activeAlerts.length === 1 ? "s" : ""} your attention
      </p>

      <div className="flex flex-col gap-4">
        {activeAlerts.map((alert) => {
          const isHigh = alert.severity === "high";
          const isMedium = alert.severity === "medium";

          // Parse the alert type into a friendly label
          const typeLabel =
            alert.type === "red_flag"
              ? "⚠️ Red Flag Symptom"
              : alert.type === "missed_dose"
                ? "💊 Missed Dose"
                : "⚠️ Warning";

          return (
            <Card key={alert.id} variant={isHigh ? "alert" : isMedium ? "warning" : "default"}>
              {/* Severity badge */}
              <div className="flex items-center justify-between mb-3">
                <Badge variant={isHigh ? "danger" : isMedium ? "warning" : "info"}>
                  {isHigh ? "HIGH" : isMedium ? "MEDIUM" : "LOW"}
                </Badge>
                <span className="text-[14px] text-[#1B2A4A]/40">{typeLabel}</span>
              </div>

              <h3 className="text-[28px] font-bold text-[#1B2A4A] mb-2">
                {alert.message.split(".")[0]}
              </h3>

              <p className="text-[20px] text-[#1B2A4A]/80 mb-6">
                {alert.message}
              </p>

              <Button
                variant="outline"
                onClick={() => dismissAlert(alert.id)}
              >
                ✓ Got it
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Caregiver Alerts View ─── */

function CaregiverAlertsView() {
  const { state, dismissAlert } = useCarePlan();
  const plan = state.carePlan!;

  const activeAlerts = plan.alerts.filter((a) => !a.dismissed);
  const dismissedAlerts = plan.alerts.filter((a) => a.dismissed);

  const highAlerts = activeAlerts.filter((a) => a.severity === "high");
  const mediumAlerts = activeAlerts.filter((a) => a.severity === "medium");
  const lowAlerts = activeAlerts.filter((a) => a.severity === "low");

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const renderAlertCard = (alert: typeof activeAlerts[0]) => {
    const isHigh = alert.severity === "high";
    const isMedium = alert.severity === "medium";

    const typeIcon =
      alert.type === "red_flag" ? "⚠️" : alert.type === "missed_dose" ? "💊" : "⚡";

    return (
      <Card key={alert.id} variant={isHigh ? "alert" : isMedium ? "warning" : "default"}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={isHigh ? "danger" : isMedium ? "warning" : "info"}>
              {isHigh ? "HIGH" : isMedium ? "MEDIUM" : "LOW"}
            </Badge>
            <span className="text-[14px] text-[#1B2A4A]/40">{typeIcon} {alert.type === "red_flag" ? "Red Flag" : alert.type === "missed_dose" ? "Missed Dose" : "Warning"}</span>
          </div>
          <span className="text-[14px] text-[#1B2A4A]/40">
            {formatTimestamp(alert.timestamp)}
          </span>
        </div>

        <h3 className="text-[22px] font-bold text-[#1B2A4A] mb-2">
          {alert.message.split(".")[0]}
        </h3>

        <p className="text-[18px] text-[#1B2A4A]/70 mb-4">
          {alert.message}
        </p>

        <Button
          variant="ghost"
          className="text-[16px]"
          onClick={() => dismissAlert(alert.id)}
        >
          Dismiss
        </Button>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[28px] font-bold text-[#1B2A4A]">Alerts</h2>
        {activeAlerts.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="danger">{activeAlerts.length} active</Badge>
          </div>
        )}
      </div>

      {activeAlerts.length === 0 ? (
        <Card variant="success">
          <p className="text-[22px] font-bold text-[#4A9E8E]">
            No alerts — everything is on track
          </p>
          <p className="text-[18px] text-[#1B2A4A]/70 mt-2">
            All medication doses are being taken and no red-flag symptoms have been reported.
          </p>
        </Card>
      ) : (
        <>
          {/* High Priority */}
          {highAlerts.length > 0 && (
            <div>
              <h3 className="text-[18px] font-bold text-[#D14B4B] mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D14B4B]" />
                High Priority ({highAlerts.length})
              </h3>
              <div className="flex flex-col gap-4">
                {highAlerts.map(renderAlertCard)}
              </div>
            </div>
          )}

          {/* Medium Priority */}
          {mediumAlerts.length > 0 && (
            <div>
              <h3 className="text-[18px] font-bold text-[#E8A838] mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8A838]" />
                Medium Priority ({mediumAlerts.length})
              </h3>
              <div className="flex flex-col gap-4">
                {mediumAlerts.map(renderAlertCard)}
              </div>
            </div>
          )}

          {/* Low Priority */}
          {lowAlerts.length > 0 && (
            <div>
              <h3 className="text-[18px] font-bold text-[#1B2A4A]/50 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B2A4A]/30" />
                Low Priority ({lowAlerts.length})
              </h3>
              <div className="flex flex-col gap-4">
                {lowAlerts.map(renderAlertCard)}
              </div>
            </div>
          )}

          {/* Dismissed alerts */}
          {dismissedAlerts.length > 0 && (
            <details className="mt-4">
              <summary className="text-[16px] text-[#1B2A4A]/40 cursor-pointer font-medium">
                Dismissed ({dismissedAlerts.length})
              </summary>
              <div className="flex flex-col gap-3 mt-4">
                {dismissedAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-[#F8F6F3] rounded-xl opacity-60">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info">Dismissed</Badge>
                      <span className="text-[13px] text-[#1B2A4A]/40">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-[16px] text-[#1B2A4A]/70">{alert.message}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Alerts Page ─── */

export default function AlertsPage() {
  const { state } = useCarePlan();

  if (!state.carePlan) {
    return <Navigate to="/upload" replace />;
  }

  return state.role === "patient" ? <PatientAlertsView /> : <CaregiverAlertsView />;
}