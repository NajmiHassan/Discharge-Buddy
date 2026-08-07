import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type { CarePlanState, CarePlanAction, Role, CheckInEntry } from "../types";
import { mockCarePlan } from "../data/mockCarePlan";

const initialState: CarePlanState = {
  carePlan: null,
  role: "patient",
  checkIns: [],
};

function carePlanReducer(state: CarePlanState, action: CarePlanAction): CarePlanState {
  switch (action.type) {
    case "LOAD_PLAN":
      return { ...state, carePlan: action.payload };

    case "TOGGLE_ROLE":
      return {
        ...state,
        role: state.role === "patient" ? "caregiver" : "patient",
      };

    case "SET_ROLE":
      return { ...state, role: action.payload };

    case "MARK_MED_TAKEN": {
      if (!state.carePlan) return state;
      return {
        ...state,
        carePlan: {
          ...state.carePlan,
          medications: state.carePlan.medications.map((med) =>
            med.id === action.payload.medicationId
              ? { ...med, takenToday: true }
              : med
          ),
        },
      };
    }

    case "SUBMIT_CHECK_IN":
      return {
        ...state,
        checkIns: [...state.checkIns, action.payload],
      };

    case "DISMISS_ALERT": {
      if (!state.carePlan) return state;
      return {
        ...state,
        carePlan: {
          ...state.carePlan,
          alerts: state.carePlan.alerts.map((a) =>
            a.id === action.payload.alertId ? { ...a, dismissed: true } : a
          ),
        },
      };
    }

    case "TOGGLE_CHECKLIST": {
      if (!state.carePlan) return state;
      return {
        ...state,
        carePlan: {
          ...state.carePlan,
          checklist: state.carePlan.checklist.map((item) =>
            item.id === action.payload.itemId
              ? { ...item, completed: !item.completed }
              : item
          ),
        },
      };
    }

    default:
      return state;
  }
}

interface CarePlanContextValue {
  state: CarePlanState;
  loadSamplePlan: () => void;
  toggleRole: () => void;
  setRole: (role: Role) => void;
  markMedTaken: (medicationId: string) => void;
  submitCheckIn: (entry: CheckInEntry) => void;
  dismissAlert: (alertId: string) => void;
  toggleChecklist: (itemId: string) => void;
}

const CarePlanContext = createContext<CarePlanContextValue | null>(null);

export function CarePlanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(carePlanReducer, initialState);

  const loadSamplePlan = useCallback(() => {
    dispatch({ type: "LOAD_PLAN", payload: { ...mockCarePlan } });
  }, []);

  const toggleRole = useCallback(() => {
    dispatch({ type: "TOGGLE_ROLE" });
  }, []);

  const setRole = useCallback((role: Role) => {
    dispatch({ type: "SET_ROLE", payload: role });
  }, []);

  const markMedTaken = useCallback((medicationId: string) => {
    dispatch({ type: "MARK_MED_TAKEN", payload: { medicationId } });
  }, []);

  const submitCheckIn = useCallback((entry: CheckInEntry) => {
    dispatch({ type: "SUBMIT_CHECK_IN", payload: entry });
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    dispatch({ type: "DISMISS_ALERT", payload: { alertId } });
  }, []);

  const toggleChecklist = useCallback((itemId: string) => {
    dispatch({ type: "TOGGLE_CHECKLIST", payload: { itemId } });
  }, []);

  return (
    <CarePlanContext.Provider
      value={{
        state,
        loadSamplePlan,
        toggleRole,
        setRole,
        markMedTaken,
        submitCheckIn,
        dismissAlert,
        toggleChecklist,
      }}
    >
      {children}
    </CarePlanContext.Provider>
  );
}

export function useCarePlan(): CarePlanContextValue {
  const ctx = useContext(CarePlanContext);
  if (!ctx) throw new Error("useCarePlan must be used within a CarePlanProvider");
  return ctx;
}