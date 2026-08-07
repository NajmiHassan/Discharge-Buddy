import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CarePlanProvider } from "./contexts/CarePlanContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthenticatedLayout } from "./components/layout";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import PlanOverviewPage from "./pages/PlanOverviewPage";
import MedicationSchedulePage from "./pages/MedicationSchedulePage";
import DailyCheckInPage from "./pages/DailyCheckInPage";
import AlertsPage from "./pages/AlertsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarePlanProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes — Upload is standalone (no tabs) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/upload" element={<UploadPage />} />

              {/* Routes with header + tab bar layout */}
              <Route element={<AuthenticatedLayout />}>
                <Route path="/plan" element={<PlanOverviewPage />} />
                <Route path="/medications" element={<MedicationSchedulePage />} />
                <Route path="/check-in" element={<DailyCheckInPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CarePlanProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}