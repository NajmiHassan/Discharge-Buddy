import { useAppState } from '../../context/AppContext';

export default function RoleSwitcher() {
  const { role, setRole } = useAppState();

  return (
    <div className="flex items-center gap-2 bg-muted rounded-full p-1">
      <button
        onClick={() => setRole('patient')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
          role === 'patient'
            ? 'bg-white text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={role === 'patient'}
      >
        Patient
      </button>
      <button
        onClick={() => setRole('caregiver')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
          role === 'caregiver'
            ? 'bg-white text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={role === 'caregiver'}
      >
        Caregiver
      </button>
    </div>
  );
}