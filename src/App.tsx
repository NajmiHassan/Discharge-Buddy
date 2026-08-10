import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/layout/Header';
import DashboardPage from './components/dashboard/DashboardPage';
import PatientProfile from './components/patient/PatientProfile';
import CheckInPage from './components/checkin/CheckInPage';
import AddPatientPage from './components/add-patient/AddPatientPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/patient/:id" element={<PatientProfile />} />
              <Route path="/checkin/:patientId" element={<CheckInPage />} />
              <Route path="/add-patient" element={<AddPatientPage />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}