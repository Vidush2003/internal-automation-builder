import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

const API_BASE = import.meta.env.VITE_API_URL;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function SkillPill({ skill }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
      {skill}
    </span>
  );
}

function EmptyField({ label }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/8 text-gray-400 text-xs">
      <Icon className="text-[14px]">info</Icon>
      <span>{label} not found in resume</span>
    </div>
  );
}

/* ─── Score Bar ───────────────────────────────────────────────────────────── */
function ScoreBar({ label, score, icon }) {
  const percentage = Math.max(0, Math.min(100, score || 0));
  
  // Determine color based on score
  let colorClass = "bg-amber-500";
  if (percentage >= 80) colorClass = "bg-emerald-500";
  else if (percentage < 50) colorClass = "bg-red-500";

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
          {icon && <Icon className="text-[14px]">{icon}</Icon>}
          {label}
        </span>
        <span className="text-xs font-bold text-gray-900 dark:text-white">{percentage}/100</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ResumeAnalyzer() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile]         = useState(null);   // File object
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [candidate, setCandidate] = useState(null);

  /* ── File selection ──────────────────────────────────────────────────── */
  const selectFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }
    setError('');
    setCandidate(null);
    setFile(f);
  };

  const onInputChange = (e) => selectFile(e.target.files?.[0]);

  /* ── Drag-and-drop ───────────────────────────────────────────────────── */
  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true);  }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setDragging(false); }, []);
  const onDrop      = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files?.[0]);
  }, []);

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (!file) return;
    setError('');
    setCandidate(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append('resume', file);

      const response = await fetch(`${API_BASE}/resume/analyze`, {
        method: 'POST',
        credentials: 'include',
        body: form,
        // No Content-Type header — browser sets it automatically with boundary
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || "We couldn't analyze this PDF. It may be corrupted or contain only scanned images.");
      }
      setCandidate(data.candidate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setCandidate(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/25">
              <Icon className="text-white text-[20px]">description</Icon>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-gray-900 dark:text-white">
                Resume Analyzer
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered candidate data extraction · Upload a PDF from your computer
              </p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            id="resume-file-input"
            onChange={onInputChange}
          />

          {/* Drop target */}
          <motion.label
            htmlFor="resume-file-input"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            animate={{ borderColor: dragging ? '#f59e0b' : undefined }}
            className={`flex flex-col items-center justify-center gap-4 w-full rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors
              ${dragging
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10'
                : file
                  ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/5'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#111115] hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-50/30 dark:hover:bg-amber-500/5'
              }`}
          >
            {file ? (
              /* File selected state */
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Icon className="text-3xl text-amber-600 dark:text-amber-400">picture_as_pdf</Icon>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · PDF</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); reset(); }}
                  className="text-[11px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 mt-1"
                >
                  <Icon className="text-[13px]">close</Icon> Remove
                </button>
              </div>
            ) : (
              /* Empty drop zone */
              <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <Icon className="text-3xl text-gray-400 dark:text-gray-500">upload_file</Icon>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Drag & drop your resume here
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">or click to browse from your computer</p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                  PDF only · Max 10 MB
                </span>
              </div>
            )}
          </motion.label>

          {/* Analyze button */}
          {file && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-sm shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Icon className="text-[18px] animate-spin">progress_activity</Icon>
                  Analyzing resume…
                </>
              ) : (
                <>
                  <Icon className="text-[18px]">auto_awesome</Icon>
                  Analyze Resume
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl"
            >
              <Icon className="text-[20px] text-red-500 shrink-0 mt-0.5">error</Icon>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white dark:bg-[#111115] rounded-2xl border border-black/5 dark:border-white/8 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded animate-pulse w-1/4" />
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded animate-pulse w-1/2" />
                  </div>
                </div>
                {[85, 70, 90].map((w, i) => (
                  <div key={i} className="h-3 bg-gray-100 dark:bg-white/5 rounded animate-pulse mb-2" style={{ width: `${w}%` }} />
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 animate-pulse">Parsing PDF and running AI extraction…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {candidate && !loading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {/* Candidate header card */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-2xl font-black">
                    {candidate.name ? candidate.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold leading-tight">
                      {candidate.name || <span className="opacity-50 italic">Name not found</span>}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-white/80">
                      {candidate.email && <span className="flex items-center gap-1"><Icon className="text-[15px]">mail</Icon>{candidate.email}</span>}
                      {candidate.phone && <span className="flex items-center gap-1"><Icon className="text-[15px]">phone</Icon>{candidate.phone}</span>}
                    </div>
                    {candidate.experience_years > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold">
                        <Icon className="text-[13px]">work</Icon>
                        {candidate.experience_years} year{candidate.experience_years !== 1 ? 's' : ''} of experience
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {candidate.summary ? (
                <div className="bg-white dark:bg-[#111115] rounded-2xl border border-black/5 dark:border-white/8 shadow-sm p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
                    <Icon className="text-[14px]">auto_awesome</Icon>AI Summary
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{candidate.summary}</p>
                </div>
              ) : <EmptyField label="Summary" />}

              {/* AI Scores */}
              {candidate.scores && (
                <div className="bg-white dark:bg-[#111115] rounded-2xl border border-black/5 dark:border-white/8 shadow-sm p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5">
                    <Icon className="text-[14px]">analytics</Icon>AI Evaluation Scores
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <ScoreBar label="Overall Match" score={candidate.scores.overall} icon="star" />
                    <ScoreBar label="Technical Skills" score={candidate.scores.skills} icon="code" />
                    <ScoreBar label="Experience" score={candidate.scores.experience} icon="work" />
                    <ScoreBar label="Projects & Impact" score={candidate.scores.projects} icon="rocket_launch" />
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="bg-white dark:bg-[#111115] rounded-2xl border border-black/5 dark:border-white/8 shadow-sm p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                  <Icon className="text-[14px]">code</Icon>Skills
                  {candidate.skills?.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                      {candidate.skills.length} found
                    </span>
                  )}
                </p>
                {candidate.skills?.length > 0
                  ? <div className="flex flex-wrap gap-2">{candidate.skills.map((s, i) => <SkillPill key={i} skill={s} />)}</div>
                  : <EmptyField label="Skills" />}
              </div>

              {/* Education */}
              <div className="bg-white dark:bg-[#111115] rounded-2xl border border-black/5 dark:border-white/8 shadow-sm p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                  <Icon className="text-[14px]">school</Icon>Education
                </p>
                {candidate.education?.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.education.map((edu, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-black/5 dark:border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Icon className="text-[15px] text-amber-600 dark:text-amber-400">school</Icon>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{edu.degree || 'Degree not specified'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyField label="Education" />}
              </div>

              {/* Analyze another */}
              <button
                onClick={reset}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center justify-center gap-2"
              >
                <Icon className="text-[16px]">refresh</Icon>
                Analyze another resume
              </button>

              {/* CTA */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-[#0d0d14] dark:to-[#111115] rounded-2xl border border-white/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Icon className="text-[20px] text-amber-400">account_tree</Icon>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1">Automate your hiring pipeline</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Build a workflow that receives resumes via webhook, parses them with AI, scores candidates, and notifies your team on Slack or Email.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate('/workflows')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
                      >
                        <Icon className="text-[15px]">add</Icon>
                        Build a workflow with this
                      </button>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-gray-400 font-mono">
                        Webhook → Parse Resume → AI Decide → Slack
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial empty state */}
        {!candidate && !loading && !error && !file && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon className="text-3xl text-amber-500">description</Icon>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Upload a resume to get started</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              Drag a PDF onto the upload zone above, or click it to browse your files.
              The AI will extract name, contact, skills, experience, and education.
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
