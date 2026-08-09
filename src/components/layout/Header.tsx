import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, Plus } from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';

export default function Header() {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const isCheckin = location.pathname.includes('/checkin');
  const isAddPatient = location.pathname === '/add-patient';

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isDashboard && (
            <Link
              to="/"
              className="touch-target flex items-center justify-center text-foreground/70 hover:text-foreground"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <Heart className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-lg font-semibold text-foreground">
              Discharge Buddy
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isDashboard && (
            <Link
              to="/add-patient"
              className="touch-target flex items-center justify-center w-9 h-9 rounded-full bg-primary text-on-primary hover:bg-primary/90"
              aria-label="Add new patient"
            >
              <Plus className="w-5 h-5" />
            </Link>
          )}
          {!isCheckin && !isAddPatient && <RoleSwitcher />}
        </div>
      </div>
    </header>
  );
}