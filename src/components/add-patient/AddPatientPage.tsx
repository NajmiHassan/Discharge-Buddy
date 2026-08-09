import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../../lib/supabase';
import { config } from '../../lib/config';
import type { Medication, Appointment, WarningSign, EmergencyContact } from '../../types';

// Use Vite's static asset resolution to serve the worker from the same origin
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ExtractedData {
  name: string;
  medications: Medication[];
  appointments: Appointment[];
  warning_signs: WarningSign[];
  emergency_contacts: EmergencyContact[];
  care_instructions: string;
  dietary_restrictions: string;
  activity_restrictions: string;
}

export default function AddPatientPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'paste' | 'upload'>('choose');
  const [pastedText, setPastedText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [editableData, setEditableData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'review' | 'saving'>('input');

  async function handleExtract(text: string) {
    setProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        config.edgeFunctions.extractDischarge,
        { method: 'POST', body: { text } }
      );

      if (fnError) throw new Error(fnError.message);
      if (!data?.result) throw new Error('No data extracted');

      setEditableData(data.result);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Failed to extract data');
    } finally {
      setProcessing(false);
    }
  }

  function handleFieldChange(field: keyof ExtractedData, value: any) {
    setEditableData((prev) => (prev ? { ...prev, [field]: value } : null));
  }

  async function savePatient() {
    if (!editableData?.name) {
      setError('Patient name is required');
      return;
    }

    setStep('saving');
    setError(null);

    try {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          name: editableData.name,
          discharge_date: new Date().toISOString().split('T')[0],
          status: 'on_track',
        })
        .select()
        .single();

      if (patientError) throw patientError;

      const { error: summaryError } = await supabase
        .from('discharge_summaries')
        .insert({
          patient_id: patient.id,
          raw_text: pastedText,
          medications: editableData.medications || [],
          appointments: editableData.appointments || [],
          warning_signs: editableData.warning_signs || [],
          emergency_contacts: editableData.emergency_contacts || [],
          care_instructions: editableData.care_instructions || '',
          dietary_restrictions: editableData.dietary_restrictions || '',
          activity_restrictions: editableData.activity_restrictions || '',
        });

      if (summaryError) throw summaryError;

      navigate(`/patient/${patient.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save patient');
      setStep('review');
    }
  }

  if ((step === 'review' || step === 'saving') && editableData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">
          Review Patient Data
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          We extracted this information from the instructions. Edit if needed.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <FieldGroup label="Patient Name">
            <input
              type="text"
              value={editableData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Full name"
            />
          </FieldGroup>

          <FieldGroup label="Medications">
            <JSONListEditor
              value={editableData.medications}
              fields={[
                { key: 'name', label: 'Name', placeholder: 'Medication name' },
                { key: 'dosage', label: 'Dosage', placeholder: 'e.g. 10 mg' },
                { key: 'frequency', label: 'Frequency', placeholder: 'e.g. Once daily' },
                { key: 'purpose', label: 'Purpose', placeholder: 'e.g. Pain relief' },
              ]}
              onChange={(v) => handleFieldChange('medications', v)}
            />
          </FieldGroup>

          <FieldGroup label="Appointments">
            <JSONListEditor
              value={editableData.appointments}
              fields={[
                { key: 'type', label: 'Type', placeholder: 'e.g. Follow-up' },
                { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD' },
                { key: 'provider', label: 'Provider', placeholder: 'e.g. Dr. Smith' },
                { key: 'notes', label: 'Notes', placeholder: 'Optional' },
              ]}
              onChange={(v) => handleFieldChange('appointments', v)}
            />
          </FieldGroup>

          <FieldGroup label="Warning Signs">
            <JSONListEditor
              value={editableData.warning_signs}
              fields={[
                { key: 'sign', label: 'Sign', placeholder: 'e.g. Fever > 100.4°F' },
                { key: 'action', label: 'Action', placeholder: 'e.g. Call doctor' },
              ]}
              onChange={(v) => handleFieldChange('warning_signs', v)}
            />
          </FieldGroup>

          <FieldGroup label="Emergency Contacts">
            <JSONListEditor
              value={editableData.emergency_contacts}
              fields={[
                { key: 'name', label: 'Name', placeholder: 'Contact name' },
                { key: 'role', label: 'Role', placeholder: 'e.g. Spouse' },
                { key: 'phone', label: 'Phone', placeholder: '(555) 123-4567' },
              ]}
              onChange={(v) => handleFieldChange('emergency_contacts', v)}
            />
          </FieldGroup>

          <FieldGroup label="Care Instructions">
            <textarea
              value={editableData.care_instructions}
              onChange={(e) => handleFieldChange('care_instructions', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 min-h-[100px]"
              placeholder="Detailed care instructions..."
            />
          </FieldGroup>

          <FieldGroup label="Dietary Restrictions">
            <textarea
              value={editableData.dietary_restrictions}
              onChange={(e) => handleFieldChange('dietary_restrictions', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 min-h-[60px]"
              placeholder="Dietary restrictions..."
            />
          </FieldGroup>

          <FieldGroup label="Activity Restrictions">
            <textarea
              value={editableData.activity_restrictions}
              onChange={(e) => handleFieldChange('activity_restrictions', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 min-h-[60px]"
              placeholder="Activity restrictions..."
            />
          </FieldGroup>

          <div className="flex gap-3 pt-2">
            <button
              onClick={savePatient}
              disabled={step === 'saving'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {step === 'saving' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Patient
                </>
              )}
            </button>
            <button
              onClick={() => setStep('input')}
              className="px-4 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-border transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'paste') {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">
          Paste Discharge Instructions
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Paste the full text of the discharge summary below. We'll extract the key information.
        </p>

        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 min-h-[250px] resize-y"
          placeholder="Paste discharge instructions here..."
        />

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleExtract(pastedText)}
            disabled={!pastedText.trim() || processing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Extract Data
              </>
            )}
          </button>
          <button
            onClick={() => setMode('choose')}
            className="px-4 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-border transition-all"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Upload mode
  if (mode === 'upload') {
    return (
      <UploadZone
        onTextExtracted={(text) => { setPastedText(text); handleExtract(text); }}
        onDataExtracted={(data) => { setEditableData(data); setStep('review'); }}
        onBack={() => setMode('choose')}
        error={error}
      />
    );
  }

  // Choose mode
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h2 className="font-heading text-xl font-bold text-foreground mb-1">
        Add New Patient
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Add a patient by providing their discharge instructions.
      </p>

      <div className="space-y-4">
        <button
          onClick={() => setMode('paste')}
          className="w-full flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:shadow-sm hover:border-primary/30 transition-all text-left"
        >
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">Paste Text</div>
            <div className="text-sm text-muted-foreground">
              Copy and paste the discharge summary text
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setMode('upload');
          }}
          className="w-full flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:shadow-sm hover:border-primary/30 transition-all text-left"
        >
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">Upload File</div>
            <div className="text-sm text-muted-foreground">
              Upload a PDF or image of the discharge instructions
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

/* Upload Zone Component */
function UploadZone({
  onTextExtracted,
  onDataExtracted,
  onBack,
  error,
}: {
  onTextExtracted: (text: string) => void;
  onDataExtracted: (data: ExtractedData) => void;
  onBack: () => void;
  error: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setLocalError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: () => {
      setLocalError('Only PDF and image files (max 10MB) are accepted.');
    },
  });

  async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ');
      pages.push(pageText);
    }
    return pages.join('\n');
  }

  async function processFile() {
    if (!file) return;
    setExtracting(true);
    setLocalError(null);

    try {
      if (file.type === 'application/pdf') {
        // Extract text from PDF using pdf.js
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractTextFromPDF(arrayBuffer);
        if (!text || text.trim().length < 10) {
          setLocalError('Could not extract text from this PDF. The file may be scanned or image-based. Try pasting the text directly.');
          setExtracting(false);
          return;
        }
        onTextExtracted(text);
      } else if (file.type.startsWith('image/')) {
        // For images: read as base64 and send to edge function for OCR
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          if (!base64) {
            setLocalError('Failed to read image file.');
            setExtracting(false);
            return;
          }

          try {
            const { data, error: fnError } = await supabase.functions.invoke(
              config.edgeFunctions.extractDischarge,
              { method: 'POST', body: { image: base64 } }
            );

            if (fnError) throw new Error(fnError.message);
            if (!data?.result) throw new Error('No data extracted from image');

            onDataExtracted(data.result);
          } catch (err: any) {
            setLocalError(err.message || 'Failed to process image. Try pasting the text directly.');
          } finally {
            setExtracting(false);
          }
        };
        reader.readAsDataURL(file);
        return;
      } else if (file.type === 'text/plain') {
        // Plain text file
        const text = await file.text();
        if (!text || text.trim().length < 10) {
          setLocalError('The file appears to be empty or too short. Please check the file.');
          setExtracting(false);
          return;
        }
        onTextExtracted(text);
      } else {
        setLocalError('Unsupported file type. Please upload a PDF, image, or text file.');
        setExtracting(false);
      }
    } catch {
      setLocalError('Failed to process file. Try pasting the text directly.');
      setExtracting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h2 className="font-heading text-xl font-bold text-foreground mb-1">
        Upload Discharge Instructions
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a PDF or photo of the discharge summary.
      </p>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        {file ? (
          <div>
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-foreground">
              {isDragActive ? 'Drop file here' : 'Drag & drop or tap to select'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, PNG, JPG — max 10MB
            </p>
          </div>
        )}
      </div>

      {(localError || error) && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-red-800">{localError || error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={processFile}
          disabled={!file || extracting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50"
        >
          {extracting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Extract Data
            </>
          )}
        </button>
        <button
          onClick={onBack}
          className="px-4 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-border transition-all"
        >
          Back
        </button>
      </div>
    </div>
  );
}

/* Helper components */

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function JSONListEditor({
  value,
  fields,
  onChange,
}: {
  value: any[];
  fields: { key: string; label: string; placeholder: string }[];
  onChange: (v: any[]) => void;
}) {
  function updateItem(index: number, fieldKey: string, fieldValue: string) {
    const updated = [...value];
    updated[index] = { ...updated[index], [fieldKey]: fieldValue };
    onChange(updated);
  }

  function addItem() {
    const empty: Record<string, string> = {};
    fields.forEach((f) => (empty[f.key] = ''));
    onChange([...value, empty]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">None added yet</p>
      )}
      {value.map((item, i) => (
        <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-xs text-destructive hover:underline"
            >
              Remove
            </button>
          </div>
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-muted-foreground mb-0.5">
                {field.label}
              </label>
              <input
                type="text"
                value={item[field.key] ?? ''}
                onChange={(e) => updateItem(i, field.key, e.target.value)}
                className="w-full px-2 py-1.5 border border-border rounded text-sm focus:border-ring focus:outline-none"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-xs text-primary font-medium hover:underline"
      >
        + Add {fields[0]?.label ?? 'item'}
      </button>
    </div>
  );
}