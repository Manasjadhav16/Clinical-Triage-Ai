import { useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { usePDF } from 'react-to-pdf'
import {
  Activity, AlertTriangle, Download, FileText,
  Heart, Loader2, Stethoscope, User,
} from 'lucide-react'

// ─── Severity config ────────────────────────────────────────────────────────
const SEVERITY = {
  1: { label: 'IMMEDIATE',   color: 'red',     pulse: true  },
  2: { label: 'EMERGENT',    color: 'orange',  pulse: true  },
  3: { label: 'URGENT',      color: 'amber',   pulse: false },
  4: { label: 'LESS URGENT', color: 'sky',     pulse: false },
  5: { label: 'NON-URGENT',  color: 'emerald', pulse: false },
}

const BADGE_STYLES = {
  red:     { bg: 'bg-red-600',     shadow: 'shadow-red-500/50 shadow-2xl',     text: 'text-white', muted: 'text-red-100'     },
  orange:  { bg: 'bg-orange-500',  shadow: 'shadow-orange-400/50 shadow-xl',   text: 'text-white', muted: 'text-orange-100'  },
  amber:   { bg: 'bg-amber-400',   shadow: 'shadow-amber-300/40 shadow-lg',    text: 'text-white', muted: 'text-amber-50'    },
  sky:     { bg: 'bg-sky-500',     shadow: 'shadow-sky-400/30 shadow-md',      text: 'text-white', muted: 'text-sky-100'     },
  emerald: { bg: 'bg-emerald-500', shadow: 'shadow-emerald-400/30 shadow-md',  text: 'text-white', muted: 'text-emerald-50'  },
}

// ─── Reusable primitives ─────────────────────────────────────────────────────
const inputCls =
  'w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 ' +
  'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition'

const labelCls = 'text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 block'

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-md ${className}`}>
    {children}
  </div>
)

const SectionHeader = ({ icon: Icon, label, color = 'text-slate-400' }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={15} className={color} />
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
)

// ─── Main component ──────────────────────────────────────────────────────────
export default function App() {
  const [patientName,    setPatientName]    = useState('')
  const [patientAge,     setPatientAge]     = useState('')
  const [patientSex,     setPatientSex]     = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [medications,    setMedications]    = useState('')
  const [allergies,      setAllergies]      = useState('')
  const [vitals,         setVitals]         = useState('')
  const [symptoms,       setSymptoms]       = useState('')
  const [result,         setResult]         = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)

  const { toPDF, targetRef } = usePDF({
    filename: `clinical-report-${patientName.trim() || 'patient'}.pdf`,
  })

  const handleSubmit = async () => {
    if (!patientName.trim() || !patientAge || !patientSex || !symptoms.trim()) {
      setError('Patient name, age, sex, and symptoms are required.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {
        patient_name: patientName,
        patient_age:  parseInt(patientAge, 10),
        patient_sex:  patientSex,
        raw_symptoms: symptoms,
      }
      if (medicalHistory.trim()) payload.medical_history     = medicalHistory.trim()
      if (medications.trim())    payload.current_medications = medications.trim()
      if (allergies.trim())      payload.allergies           = allergies.trim()
      if (vitals.trim())         payload.vitals              = vitals.trim()

      const response = await axios.post('http://localhost:8000/intake', payload)
      setResult(response.data)
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the backend. Make sure uvicorn is running on port 8000.')
      } else if (err.response.status === 429 || (err.response.status === 500 && JSON.stringify(err.response.data).includes('RESOURCE_EXHAUSTED'))) {
        setError('Gemini API quota exhausted (free tier: 20 requests/day). Please wait until the quota resets or upgrade your Google AI Studio plan at aistudio.google.com.')
      } else if (err.response.data?.detail) {
        setError(typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail))
      } else {
        setError(`Server error ${err.response.status} — check the uvicorn terminal for the full stack trace.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const level   = result?.triage_evaluation?.triage_level
  const sev     = SEVERITY[level]        ?? SEVERITY[5]
  const styles  = BADGE_STYLES[sev.color] ?? BADGE_STYLES.emerald
  const facts   = result?.extracted_facts
  const note    = result?.clinical_note

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-8 py-4 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <Heart className="text-rose-500" size={22} fill="currentColor" />
          <span className="text-lg font-bold text-slate-800 tracking-tight">Clinical Triage AI</span>
          <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <span className="ml-auto text-xs text-slate-400 font-mono">Gemini 2.5 Flash · 3-Agent Pipeline</span>
      </header>

      {/* ── Main two-pane layout ──────────────────────────────────────────── */}
      <main className="flex flex-1 gap-0 p-5 gap-4 overflow-hidden">

        {/* ── LEFT PANE — Intake Form ───────────────────────────────────── */}
        <aside className="w-[460px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
          <Card className="p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Patient Intake</h2>
              <p className="text-xs text-slate-400 mt-0.5">Complete required fields marked <span className="text-rose-500">*</span></p>
            </div>

            {/* Patient Name */}
            <div>
              <label className={labelCls}>Patient Name <span className="text-rose-500">*</span></label>
              <input className={inputCls} placeholder="Full legal name" value={patientName} onChange={e => setPatientName(e.target.value)} />
            </div>

            {/* Age + Sex */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Age <span className="text-rose-500">*</span></label>
                <input
                  className={inputCls} type="number" min="0" max="130"
                  placeholder="e.g. 72" value={patientAge}
                  onChange={e => setPatientAge(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Biological Sex <span className="text-rose-500">*</span></label>
                <select
                  className={`${inputCls} cursor-pointer bg-slate-50`}
                  value={patientSex} onChange={e => setPatientSex(e.target.value)}
                >
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* SAMPLE History */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">SAMPLE History</p>

              {[
                { label: 'Medical History',       val: medicalHistory, set: setMedicalHistory, ph: 'e.g. Hypertension, T2DM, AFib'         },
                { label: 'Current Medications',   val: medications,    set: setMedications,    ph: 'e.g. Warfarin 5mg, Metformin 500mg'   },
                { label: 'Allergies',             val: allergies,      set: setAllergies,      ph: 'e.g. Penicillin, Sulfa drugs'          },
                { label: 'Vitals',                val: vitals,         set: setVitals,          ph: 'e.g. HR 108, BP 88/60, SpO2 94%'      },
              ].map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label className={labelCls}>{label}</label>
                  <input className={inputCls} placeholder={ph} value={val} onChange={e => set(e.target.value)} />
                </div>
              ))}
            </div>

            {/* Symptoms */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelCls}>Presenting Symptoms <span className="text-rose-500">*</span></label>
              <textarea
                className={`${inputCls} resize-none min-h-[130px]`}
                placeholder="Describe the patient's symptoms in plain language…"
                value={symptoms} onChange={e => setSymptoms(e.target.value)}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit} disabled={loading}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Analysing…</>
                : 'Run Triage Analysis'
              }
            </button>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            )}
          </Card>
        </aside>

        {/* ── RIGHT PANE — Triage Results ───────────────────────────────── */}
        <section className="flex-1 overflow-y-auto">

          {/* Empty / loading states */}
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <Activity size={36} className="opacity-30" />
              <p className="text-sm">Results will appear here after analysis.</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={36} className="animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Running 3-agent clinical pipeline…</p>
              <p className="text-xs text-slate-300">Extract → Evaluate → Format</p>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-4 max-w-3xl" ref={targetRef}>

              {/* Results header row with PDF button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Triage Results</h2>
                  <p className="text-xs text-slate-400">{patientName} · {patientAge}yo {patientSex}</p>
                </div>
                <button
                  onClick={toPDF}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
                >
                  <Download size={13} /> Download Clinical Report (PDF)
                </button>
              </div>

              {/* ── Severity Badge ─────────────────────────────────────── */}
              <div className={`rounded-2xl px-7 py-6 ${styles.bg} ${styles.shadow} ${sev.pulse ? 'animate-pulse' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest opacity-70 ${styles.text}`}>
                      ESI Triage Level {level}
                    </p>
                    <p className={`text-5xl font-black mt-1 leading-none ${styles.text}`}>
                      {sev.label}
                    </p>
                  </div>
                  <span className={`shrink-0 mt-1 text-xs font-bold px-4 py-2 rounded-full border ${
                    result.triage_evaluation.requires_er_visit
                      ? 'bg-white/20 text-white border-white/40'
                      : 'bg-black/10 text-white/80 border-white/20'
                  }`}>
                    {result.triage_evaluation.requires_er_visit ? '⚠ ER VISIT REQUIRED' : 'No ER Required'}
                  </span>
                </div>
                <p className={`mt-4 text-sm leading-relaxed opacity-85 ${styles.muted}`}>
                  {result.triage_evaluation.clinical_reasoning}
                </p>
              </div>

              {/* ── Recommended Specialist ─────────────────────────────── */}
              <Card className="px-6 py-5">
                <SectionHeader icon={Stethoscope} label="Recommended Specialist" color="text-indigo-400" />
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-base px-5 py-2.5 rounded-xl shadow-sm">
                    <Stethoscope size={16} className="text-indigo-500" />
                    {note?.recommended_specialist}
                  </span>
                </div>
              </Card>

              {/* ── Red Flags ──────────────────────────────────────────── */}
              {note?.red_flags?.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl px-6 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={15} className="text-rose-500" />
                    <span className="text-xs font-semibold text-rose-500 uppercase tracking-widest">Clinical Red Flags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {note.red_flags.map((flag, i) => (
                      <span key={i} className="flex items-center gap-1.5 bg-white border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        <AlertTriangle size={11} /> {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Extracted Facts ────────────────────────────────────── */}
              <Card className="px-6 py-5">
                <SectionHeader icon={Activity} label="Extracted Facts" color="text-sky-400" />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Chief Complaint',      val: facts?.chief_complaint ?? '—',         capitalize: true  },
                    { label: 'Duration',             val: facts?.duration ?? '—',                 capitalize: false },
                    { label: 'Pain Scale',           val: facts?.pain_scale != null ? `${facts.pain_scale}/10` : '—', capitalize: false },
                    { label: 'Associated Symptoms',  val: facts?.associated_symptoms?.length > 0 ? facts.associated_symptoms.join(', ') : 'None reported', capitalize: false },
                  ].map(({ label, val, capitalize }) => (
                    <div key={label} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                      <p className={`text-sm text-slate-800 font-semibold ${capitalize ? 'capitalize' : ''}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* ── Clinical Note ──────────────────────────────────────── */}
              <Card className="px-6 py-5">
                <SectionHeader icon={FileText} label="Clinical Note" color="text-emerald-500" />

                {/* Executive summary */}
                <div className="bg-slate-50 border-l-4 border-indigo-400 rounded-r-xl px-4 py-3 mb-5">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Executive Summary</p>
                  <p className="text-sm text-slate-700 italic leading-relaxed">{note?.executive_summary}</p>
                </div>

                {/* Rendered Markdown */}
                <div className="
                  prose prose-sm max-w-none
                  [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-slate-500 [&_h2]:uppercase [&_h2]:tracking-widest
                  [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-slate-100
                  [&_p]:text-sm [&_p]:text-slate-600 [&_p]:leading-relaxed [&_p]:mt-1
                  [&_ul]:text-sm [&_ul]:text-slate-600 [&_li]:mt-0.5
                ">
                  <ReactMarkdown>{note?.formatted_dashboard_note}</ReactMarkdown>
                </div>
              </Card>

              {/* Bottom patient stamp */}
              <div className="flex items-center gap-2 px-1 pb-2">
                <User size={13} className="text-slate-300" />
                <span className="text-xs text-slate-300">
                  Report generated for {patientName} · {patientAge}yo {patientSex} · Clinical Triage AI
                </span>
              </div>

            </div>
          )}
        </section>
      </main>
    </div>
  )
}
