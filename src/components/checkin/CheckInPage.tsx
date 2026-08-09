import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Square, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { config } from '../../lib/config';
import { RealtimeClient } from '@speechmatics/real-time-client';
import { PCMRecorder } from '@speechmatics/browser-audio-input';
import type { Patient, DischargeSummary, AnalysisResult } from '../../types';

type CheckInPhase = 'prep' | 'connecting' | 'recording' | 'analyzing' | 'done' | 'error';

export default function CheckInPage() {
  const { patientId } = useParams<{ patientId: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [summary, setSummary] = useState<DischargeSummary | null>(null);
  const [phase, setPhase] = useState<CheckInPhase>('prep');
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  // Use refs for mutable values needed in callbacks (avoid stale closures)
  const clientRef = useRef<RealtimeClient | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const phaseRef = useRef<CheckInPhase>('prep');

  // Keep phaseRef in sync with phase state so callbacks always read latest
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (patientId) loadPatient(patientId);
    return () => cleanup();
  }, [patientId]);

  async function loadPatient(id: string) {
    try {
      const [patientRes, summaryRes] = await Promise.all([
        supabase.from('patients').select('*').eq('id', id).single(),
        supabase.from('discharge_summaries').select('*').eq('patient_id', id).single(),
      ]);
      if (patientRes.error) throw patientRes.error;
      setPatient(patientRes.data);
      if (summaryRes.data) setSummary(summaryRes.data);
    } catch (err) {
      console.error('Error loading patient:', err);
      setError('Could not load patient data');
      setPhase('error');
    }
  }

  async function startCheckIn() {
    try {
      setPhase('connecting');
      setError(null);
      setTranscript('');
      setPartialTranscript('');

      // Get Speechmatics JWT from Edge Function
      const { data: jwtData, error: jwtError } = await supabase.functions.invoke(
        config.edgeFunctions.speechmaticsToken,
        { method: 'POST' }
      );

      if (jwtError) throw new Error(`Failed to get token: ${jwtError.message}`);
      if (!jwtData?.jwt) throw new Error('No JWT received');

      // Connect to Speechmatics
      const client = new RealtimeClient();
      clientRef.current = client;

      client.addEventListener('receiveMessage', ({ data }: { data: any }) => {
        // Speechmatics v8 messages use the "message" property, not "type"
        if (data?.message === 'AddTranscript') {
          const results = data.results ?? [];
          const text = results
            .map((r: any) => r.alternatives?.[0]?.content ?? '')
            .join(' ');
          setTranscript((prev) => (prev ? prev + ' ' + text : text));
          setPartialTranscript('');
        } else if (data?.message === 'AddPartialTranscript') {
          const results = data.results ?? [];
          const text = results
            .map((r: any) => r.alternatives?.[0]?.content ?? '')
            .join(' ');
          setPartialTranscript(text);
        }
      });

      // Watch for unexpected socket closures
      client.addEventListener('socketStateChange', (evt: any) => {
        if (evt.socketState === 'closed' && phaseRef.current === 'recording') {
          setError('Transcription connection lost');
          setPhase('error');
        }
      });

      await client.start(jwtData.jwt, {
        transcription_config: {
          language: 'en',
          enable_partials: true,
        },
      });

      // Use PCMRecorder from Speechmatics SDK for proper browser audio capture
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const recorder = new PCMRecorder('/pcm-audio-worklet.min.js');
      recorderRef.current = recorder;

      // Forward captured audio to the Speechmatics client
      recorder.addEventListener('audio', (e: any) => {
        if (clientRef.current && phaseRef.current === 'recording') {
          // PCMRecorder emits Float32Array; convert to Int16 PCM for Speechmatics
          const floatData = e.data;
          const int16Data = new Int16Array(floatData.length);
          for (let i = 0; i < floatData.length; i++) {
            const s = Math.max(-1, Math.min(1, floatData[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          clientRef.current.sendAudio(int16Data.buffer);
        }
      });

      await recorder.startRecording({ audioContext });
      setPhase('recording');
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err: any) {
      console.error('Check-in start error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        setError('Microphone access is required for check-in. Please allow microphone access in your browser settings.');
      } else {
        setError(err.message || 'Failed to start check-in');
      }
      setPhase('error');
    }
  }

  async function stopCheckIn() {
    setPhase('analyzing');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop the PCMRecorder
    if (recorderRef.current) {
      try {
        recorderRef.current.stopRecording();
      } catch (e) {
        // Ignore close errors
      }
      recorderRef.current = null;
    }

    // Stop Speechmatics client
    if (clientRef.current) {
      try {
        await clientRef.current.stopRecognition();
      } catch (e) {
        // Ignore close errors
      }
      clientRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        // Ignore
      }
      audioContextRef.current = null;
    }

    const finalTranscript = transcript + (partialTranscript ? ' ' + partialTranscript : '');

    if (!finalTranscript.trim()) {
      setPhase('done');
      setAnalysisResult({
        summary: 'No speech was detected during the check-in.',
        flags: [],
        overall_status: 'on_track',
        emergency_warning: false,
        emergency_detail: null,
      });
      return;
    }

    // Send to analysis Edge Function
    try {
      const { data, error: analysisError } = await supabase.functions.invoke(
        config.edgeFunctions.checkinAnalysis,
        {
          method: 'POST',
          body: {
            transcript: finalTranscript,
            discharge_data: summary
              ? {
                  medications: summary.medications,
                  appointments: summary.appointments,
                  warning_signs: summary.warning_signs,
                  care_instructions: summary.care_instructions,
                  dietary_restrictions: summary.dietary_restrictions,
                  activity_restrictions: summary.activity_restrictions,
                }
              : null,
          },
        }
      );

      if (analysisError) throw new Error(analysisError.message);

      setAnalysisResult(data.result);

      if (patientId) {
        await supabase.from('check_ins').insert({
          patient_id: patientId,
          transcript: finalTranscript,
          analysis_result: data.result,
          duration_seconds: duration,
        });
      }

      setPhase('done');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze check-in');
      setPhase('error');
    }
  }

  function cleanup() {
    if (recorderRef.current) {
      try { recorderRef.current.stopRecording(); } catch (e) {}
      recorderRef.current = null;
    }
    if (clientRef.current) {
      try { clientRef.current.stopRecognition(); } catch (e) {}
      clientRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (!patient) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="text-center mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Voice Check-in
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{patient.name}</p>
      </div>

      {/* Check-in phases */}
      {phase === 'prep' && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
            Ready for Check-in
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
            We'll listen to you and compare your responses against your discharge instructions.
            Just speak naturally.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <strong>Important:</strong> This is not a substitute for professional medical advice.
                If you are experiencing a medical emergency, call 911 immediately.
              </div>
            </div>
          </div>

          <button
            onClick={startCheckIn}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-2xl font-semibold text-lg hover:bg-primary/90 active:scale-[0.97] transition-all shadow-lg"
          >
            <Mic className="w-6 h-6" />
            Start Check-in
          </button>
        </div>
      )}

      {phase === 'connecting' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Connecting...</p>
        </div>
      )}

      {phase === 'recording' && (
        <div className="text-center py-8">
          {/* Pulsing mic indicator */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center">
              <Mic className="w-10 h-10 text-on-primary" />
            </div>
          </div>

          <div className="text-2xl font-mono font-bold text-foreground mb-4">
            {formatTime(duration)}
          </div>

          {/* Live transcript */}
          <div className="bg-white rounded-xl border border-border p-4 mb-6 min-h-[120px] max-h-[200px] overflow-y-auto text-left">
            {transcript ? (
              <p className="text-sm text-foreground">{transcript}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Listening...</p>
            )}
            {partialTranscript && (
              <p className="text-sm text-muted-foreground/50 mt-1">{partialTranscript}</p>
            )}
          </div>

          <button
            onClick={stopCheckIn}
            className="inline-flex items-center gap-2 px-6 py-3 bg-destructive text-white rounded-xl font-semibold hover:bg-destructive/90 active:scale-[0.97] transition-all"
          >
            <Square className="w-5 h-5" />
            Stop Check-in
          </button>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Analyzing your check-in...</p>
        </div>
      )}

      {phase === 'done' && analysisResult && (
        <div className="space-y-4">
          {/* Analysis result */}
          <div
            className={`rounded-xl p-4 border ${
              analysisResult.overall_status === 'on_track'
                ? 'bg-green-50 border-green-200'
                : analysisResult.overall_status === 'mild_concern'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  analysisResult.overall_status === 'on_track'
                    ? 'text-green-800'
                    : analysisResult.overall_status === 'mild_concern'
                      ? 'text-amber-800'
                      : 'text-red-800'
                }`}
              >
                {analysisResult.overall_status === 'on_track'
                  ? 'On Track ✅'
                  : analysisResult.overall_status === 'mild_concern'
                    ? 'Mild Concern ⚠️'
                    : 'Needs Attention 🚨'}
              </div>
            </div>
          </div>

          {/* Emergency warning */}
          {analysisResult.emergency_warning && (
            <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <h3 className="font-bold text-destructive text-lg mb-1">
                Contact Your Healthcare Provider
              </h3>
              <p className="text-sm text-red-800 mb-3">
                {analysisResult.emergency_detail ||
                  'Your responses suggest you may need medical attention.'}
              </p>
              <a
                href="tel:911"
                className="inline-block px-6 py-3 bg-destructive text-white rounded-xl font-bold text-lg hover:bg-destructive/90 active:scale-[0.97] transition-all"
              >
                Call 911
              </a>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="font-heading font-semibold text-foreground mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
          </div>

          {/* Flags */}
          {analysisResult.flags.length > 0 && (
            <div className="space-y-2">
              {analysisResult.flags.map((flag, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 border ${
                    flag.type === 'concern'
                      ? 'bg-amber-50 border-amber-200'
                      : flag.type === 'positive'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-muted border-border'
                  }`}
                >
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    {flag.category}
                  </div>
                  <div className="text-sm text-foreground">{flag.detail}</div>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-muted rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">
              ⚕️ This analysis is based on a comparison of your responses against your
              discharge instructions. It is not a substitute for professional medical
              advice, diagnosis, or treatment.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/checkin/${patientId}`}
              className="flex-1 text-center px-4 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              New Check-in
            </Link>
            <Link
              to={`/patient/${patientId}`}
              className="flex-1 text-center px-4 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-border transition-all"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MicOff className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startCheckIn}
              className="px-6 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90"
            >
              Try Again
            </button>
            <Link
              to={`/patient/${patientId}`}
              className="px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-border"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
