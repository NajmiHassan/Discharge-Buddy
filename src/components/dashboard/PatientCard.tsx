import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import type { Patient } from '../../types';
import { formatStatusLabel, getStatusBg } from '../../types';

interface PatientCardProps {
  patient: Patient;
}

export default function PatientCard({ patient }: PatientCardProps) {
  return (
    <Link
      to={`/patient/${patient.id}`}
      className="block bg-white rounded-xl shadow-sm border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 no-underline"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-lg text-foreground truncate">
            {patient.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Discharged{' '}
              {patient.discharge_date
                ? new Date(patient.discharge_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/50 ml-2 shrink-0" />
      </div>

      <div className="mt-3">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBg(patient.status)}`}
        >
          {formatStatusLabel(patient.status)}
        </span>
      </div>
    </Link>
  );
}