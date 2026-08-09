import { useEffect, useState } from 'react';
import { Users, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Patient } from '../../types';
import PatientCard from './PatientCard';

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data ?? []);
    } catch (err) {
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  }

  const counts = {
    on_track: patients.filter((p) => p.status === 'on_track').length,
    needs_attention: patients.filter((p) => p.status === 'needs_attention').length,
    overdue_checkin: patients.filter((p) => p.status === 'overdue_checkin').length,
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Your Patients
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {patients.length} patient{patients.length !== 1 ? 's' : ''} under your care
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
          <div className="text-lg font-bold text-green-800">{counts.on_track}</div>
          <div className="text-xs text-green-600">On Track</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
          <div className="text-lg font-bold text-amber-800">{counts.overdue_checkin}</div>
          <div className="text-xs text-amber-600">Overdue</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
          <div className="text-lg font-bold text-red-800">{counts.needs_attention}</div>
          <div className="text-xs text-red-600">Attention</div>
        </div>
      </div>

      {/* Patient cards */}
      {patients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-heading font-semibold text-foreground mb-1">
            No patients yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Add a patient by pasting or uploading their discharge instructions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}

      {/* Empty state tips */}
      {patients.length === 0 && (
        <div className="mt-6 text-center">
          <a
            href="/add-patient"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-all"
          >
            Add Your First Patient
          </a>
        </div>
      )}
    </div>
  );
}